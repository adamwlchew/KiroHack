import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  environmentName: string;
  vpc: ec2.IVpc;
}

export class StorageStack extends cdk.Stack {
  public readonly userTable: dynamodb.Table;
  public readonly progressTable: dynamodb.Table;
  public readonly pageCompanionTable: dynamodb.Table;
  public readonly deviceSyncTable: dynamodb.Table;
  public readonly postgresInstance: rds.DatabaseInstance;
  public readonly contentBucket: s3.Bucket;
  public readonly assetsBucket: s3.Bucket;
  public readonly redisCluster: elasticache.CfnCacheCluster;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create DynamoDB tables
    this.userTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity for cost optimization
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.progressTable = new dynamodb.Table(this, 'ProgressTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pathId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying progress by pathId
    this.progressTable.addGlobalSecondaryIndex({
      indexName: 'PathIndex',
      partitionKey: { name: 'pathId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastAccessedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.pageCompanionTable = new dynamodb.Table(this, 'PageCompanionTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.deviceSyncTable = new dynamodb.Table(this, 'DeviceSyncTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'expiresAt',
    });

    // Create PostgreSQL RDS instance
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'PostgresSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for PostgreSQL RDS instance',
      allowAllOutbound: true,
    });

    this.postgresInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM), // Cost-effective instance type
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      multiAz: true, // Multi-AZ for high availability
      allocatedStorage: 20, // Start with 20GB and scale as needed
      maxAllocatedStorage: 100, // Allow storage to scale up to 100GB
      storageType: rds.StorageType.GP2,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      databaseName: 'pageflow',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'), // Managed by Secrets Manager
      parameterGroup: new rds.ParameterGroup(this, 'PostgresParams', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        parameters: {
          'max_connections': '100',
          'shared_buffers': '256MB',
        },
      }),
    });

    // Create S3 buckets
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'TransitionToInfrequentAccess',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Redis ElastiCache cluster
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Redis cluster',
      allowAllOutbound: true,
    });

    this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.small', // Cost-effective instance type
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      autoMinorVersionUpgrade: true,
    });

    // Output the DynamoDB table names
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.userTable.tableName,
      description: 'The name of the Users DynamoDB table',
      exportName: `${props.environmentName}-users-table-name`,
    });

    new cdk.CfnOutput(this, 'ProgressTableName', {
      value: this.progressTable.tableName,
      description: 'The name of the Progress DynamoDB table',
      exportName: `${props.environmentName}-progress-table-name`,
    });

    new cdk.CfnOutput(this, 'PageCompanionTableName', {
      value: this.pageCompanionTable.tableName,
      description: 'The name of the Page Companion DynamoDB table',
      exportName: `${props.environmentName}-page-companion-table-name`,
    });

    new cdk.CfnOutput(this, 'DeviceSyncTableName', {
      value: this.deviceSyncTable.tableName,
      description: 'The name of the Device Sync DynamoDB table',
      exportName: `${props.environmentName}-device-sync-table-name`,
    });

    // Output the PostgreSQL endpoint
    new cdk.CfnOutput(this, 'PostgresEndpoint', {
      value: this.postgresInstance.dbInstanceEndpointAddress,
      description: 'The endpoint of the PostgreSQL RDS instance',
      exportName: `${props.environmentName}-postgres-endpoint`,
    });

    // Output the S3 bucket names
    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: this.contentBucket.bucketName,
      description: 'The name of the Content S3 bucket',
      exportName: `${props.environmentName}-content-bucket-name`,
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      description: 'The name of the Assets S3 bucket',
      exportName: `${props.environmentName}-assets-bucket-name`,
    });

    // Output the Redis endpoint
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCluster.attrRedisEndpointAddress,
      description: 'The endpoint of the Redis ElastiCache cluster',
      exportName: `${props.environmentName}-redis-endpoint`,
    });
  }
}