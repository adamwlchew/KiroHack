import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
// import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  environmentName: string;
  vpc: ec2.IVpc;
}

export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly api: apigateway.RestApi;
  // public readonly amplifyApp: amplify.App;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'PageflowCluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

    // Create ECR repositories for microservices
    const serviceNames = [
      'user-service',
      'progress-service',
      'assessment-service',
      'learning-path-service',
      'page-companion-service',
      'device-sync-service',
      'content-gen-service',
      'curriculum-service',
      'assignment-service',
      'bedrock-service',
    ];

    const ecrRepos: Record<string, ecr.Repository> = {};
    
    serviceNames.forEach(serviceName => {
      ecrRepos[serviceName] = new ecr.Repository(this, `${serviceName}-repo`, {
        repositoryName: `pageflow/${serviceName}`,
        imageScanOnPush: true,
        lifecycleRules: [
          {
            maxImageCount: 5,
            description: 'Keep only the 5 most recent images',
          },
        ],
      });
    });

    // Create Fargate Task Definitions and Services for each microservice
    const fargateServices: Record<string, ecs.FargateService> = {};
    
    serviceNames.forEach(serviceName => {
      // Create task definition
      const taskDefinition = new ecs.FargateTaskDefinition(this, `${serviceName}-task-def`, {
        memoryLimitMiB: 512,
        cpu: 256,
      });

      // Add container to task definition
      taskDefinition.addContainer(`${serviceName}-container`, {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepos[serviceName]),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: serviceName,
          logRetention: logs.RetentionDays.ONE_WEEK,
        }),
        portMappings: [{ containerPort: 8080 }],
        environment: {
          NODE_ENV: 'production',
          SERVICE_NAME: serviceName,
        },
      });

      // Create Fargate service
      fargateServices[serviceName] = new ecs.FargateService(this, `${serviceName}-service`, {
        cluster: this.cluster,
        taskDefinition,
        desiredCount: 1, // Start with 1 instance and scale as needed
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(this, `${serviceName}-sg`, {
            vpc: props.vpc,
            description: `Security group for ${serviceName}`,
            allowAllOutbound: true,
          }),
        ],
      });

      // Configure auto-scaling
      const scaling = fargateServices[serviceName].autoScaleTaskCount({
        minCapacity: 1,
        maxCapacity: 5,
      });

      scaling.scaleOnCpuUtilization(`${serviceName}-cpu-scaling`, {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      });
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'PageflowAPI', {
      restApiName: 'Pageflow API',
      description: 'API for Pageflow AI Learning Platform',
      deployOptions: {
        stageName: props.environmentName,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
    });

    // Create Lambda authorizer for API Gateway
    const authorizerRole = new iam.Role(this, 'AuthorizerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    const authorizer = new lambda.Function(this, 'APIAuthorizer', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // This is a placeholder. In a real implementation, this would validate tokens
          // against Cognito or another auth provider
          console.log('Auth event:', JSON.stringify(event));
          
          // For now, always authorize
          return {
            principalId: 'user',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [{
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: event.methodArn
              }]
            }
          };
        };
      `),
      role: authorizerRole,
      timeout: cdk.Duration.seconds(10),
    });

    const lambdaAuthorizer = new apigateway.TokenAuthorizer(this, 'LambdaAuthorizer', {
      handler: authorizer,
    });

    // Create API resources and methods for each service
    serviceNames.forEach(serviceName => {
      const resource = this.api.root.addResource(serviceName.replace('-service', ''));
      
      // Add GET method
      resource.addMethod('GET', new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': "'application/json'",
          },
          responseTemplates: {
            'application/json': `{"message": "${serviceName} GET endpoint"}`,
          },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }), {
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        }],
        authorizer: lambdaAuthorizer,
      });
      
      // Add POST method
      resource.addMethod('POST', new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '201',
          responseParameters: {
            'method.response.header.Content-Type': "'application/json'",
          },
          responseTemplates: {
            'application/json': `{"message": "${serviceName} POST endpoint"}`,
          },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 201}',
        },
      }), {
        methodResponses: [{
          statusCode: '201',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        }],
        authorizer: lambdaAuthorizer,
      });
    });

    // TODO: Create Amplify App for web frontend
    // this.amplifyApp = new amplify.App(this, 'PageflowWebApp', {
    //   sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
    //     owner: 'pageflow',
    //     repository: 'web-frontend',
    //     oauthToken: cdk.SecretValue.secretsManager('github-token'),
    //   }),
    //   environmentVariables: {
    //     ENVIRONMENT: props.environmentName,
    //     API_URL: this.api.url,
    //   },
    //   buildSpec: amplify.BuildSpec.fromObject({
    //     version: '1.0',
    //     frontend: {
    //       phases: {
    //         preBuild: {
    //           commands: [
    //             'npm ci',
    //           ],
    //         },
    //         build: {
    //           commands: [
    //             'npm run build',
    //           ],
    //         },
    //       },
    //       artifacts: {
    //         baseDirectory: 'build',
    //         files: [
    //           '**/*',
    //         ],
    //       },
    //       cache: {
    //         paths: [
    //           'node_modules/**/*',
    //         ],
    //       },
    //     },
    //   }),
    // });

    // // Add branch for main
    // const mainBranch = this.amplifyApp.addBranch('main', {
    //   autoBuild: true,
    //   stage: 'PRODUCTION',
    // });

    // // Add branch for development
    // const devBranch = this.amplifyApp.addBranch('develop', {
    //   autoBuild: true,
    //   stage: 'DEVELOPMENT',
    //   environmentVariables: {
    //     ENVIRONMENT: 'development',
    //   },
    // });

    // Output the ECS Cluster name
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'The name of the ECS cluster',
      exportName: `${props.environmentName}-cluster-name`,
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'The URL of the API Gateway',
      exportName: `${props.environmentName}-api-url`,
    });

    // TODO: Output the Amplify App ID
    // new cdk.CfnOutput(this, 'AmplifyAppId', {
    //   value: this.amplifyApp.appId,
    //   description: 'The ID of the Amplify App',
    //   exportName: `${props.environmentName}-amplify-app-id`,
    // });
  }
}