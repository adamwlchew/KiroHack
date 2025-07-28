import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environmentName: string;
  vpc: ec2.IVpc;
  alarmEmail: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly logGroup: logs.LogGroup;
  public readonly alarmTopic: sns.Topic;
  public readonly opensearchDomain: opensearch.Domain;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'PageflowLogs', {
      logGroupName: `/aws/pageflow/${props.environmentName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SNS Topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Pageflow-${props.environmentName}-Alarms`,
    });

    // Add email subscription
    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alarmEmail)
    );

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'PageflowDashboard', {
      dashboardName: `Pageflow-${props.environmentName}-Dashboard`,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# Pageflow ${props.environmentName} Dashboard\n\nLast updated: ${new Date().toISOString()}`,
        width: 24,
        height: 2,
      }),
      
      // API Gateway metrics
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              Stage: props.environmentName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              Stage: props.environmentName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      new cloudwatch.GraphWidget({
        title: 'API Gateway 4XX/5XX Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              Stage: props.environmentName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              Stage: props.environmentName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      // ECS metrics
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      // DynamoDB metrics
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      // RDS metrics
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      // Lambda metrics
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations and Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
      
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 8,
        height: 6,
      }),
    );

    // Create CloudWatch Alarms
    
    // API Gateway 5XX errors alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'API5XXErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          Stage: props.environmentName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if API Gateway has too many 5XX errors',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    
    // RDS high CPU alarm
    const rdsHighCpuAlarm = new cloudwatch.Alarm(this, 'RDSHighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      alarmDescription: 'Alarm if RDS CPU is high for 15 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
    
    rdsHighCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    
    // ECS service high CPU alarm
    const ecsHighCpuAlarm = new cloudwatch.Alarm(this, 'ECSHighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      alarmDescription: 'Alarm if ECS CPU is high for 15 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
    
    ecsHighCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Create OpenSearch domain for log analysis
    const opensearchSecurityGroup = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for OpenSearch domain',
      allowAllOutbound: true,
    });

    this.opensearchDomain = new opensearch.Domain(this, 'PageflowOpenSearch', {
      version: opensearch.EngineVersion.OPENSEARCH_1_3,
      vpc: props.vpc,
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      securityGroups: [opensearchSecurityGroup],
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search', // Cost-effective instance type
      },
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GP2,
      },
      zoneAwareness: {
        enabled: false, // Single AZ for cost optimization
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      encryptionAtRest: {
        enabled: true,
      },
      nodeToNodeEncryption: true,
      enforceHttps: true,
      fineGrainedAccessControl: {
        masterUserName: 'admin',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create EventBridge rule for monitoring
    const monitoringRule = new events.Rule(this, 'MonitoringRule', {
      description: 'Rule to monitor critical service events',
      eventPattern: {
        source: ['aws.health', 'aws.rds', 'aws.ecs'],
        detailType: ['AWS Health Event', 'RDS DB Instance Event', 'ECS Task State Change'],
      },
    });

    monitoringRule.addTarget(new targets.SnsTopic(this.alarmTopic));

    // Output the CloudWatch Dashboard URL
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'The URL of the CloudWatch Dashboard',
      exportName: `${props.environmentName}-dashboard-url`,
    });

    // Output the Log Group name
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'The name of the CloudWatch Log Group',
      exportName: `${props.environmentName}-log-group-name`,
    });

    // Output the OpenSearch domain endpoint
    new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
      value: this.opensearchDomain.domainEndpoint,
      description: 'The endpoint of the OpenSearch domain',
      exportName: `${props.environmentName}-opensearch-endpoint`,
    });
  }
}