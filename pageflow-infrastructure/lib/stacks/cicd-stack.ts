import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codeartifact from 'aws-cdk-lib/aws-codeartifact';
import { Construct } from 'constructs';

export interface CICDStackProps extends cdk.StackProps {
  environmentName: string;
  notificationEmail: string;
}

export class CICDStack extends cdk.Stack {
  public readonly artifactBucket: s3.Bucket;
  public readonly notificationTopic: sns.Topic;
  public readonly codeArtifactDomain: codeartifact.CfnDomain;
  public readonly codeArtifactRepository: codeartifact.CfnRepository;

  constructor(scope: Construct, id: string, props: CICDStackProps) {
    super(scope, id, props);

    // Create S3 bucket for pipeline artifacts
    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create SNS topic for pipeline notifications
    this.notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      displayName: `Pageflow-${props.environmentName}-Pipeline-Notifications`,
    });

    // Add email subscription
    this.notificationTopic.addSubscription(
      new subscriptions.EmailSubscription(props.notificationEmail)
    );

    // Create CodeArtifact domain and repository
    this.codeArtifactDomain = new codeartifact.CfnDomain(this, 'PageflowDomain', {
      domainName: 'pageflow',
    });

    this.codeArtifactRepository = new codeartifact.CfnRepository(this, 'PageflowRepository', {
      domainName: this.codeArtifactDomain.domainName,
      repositoryName: 'pageflow-npm',
      externalConnections: ['public:npmjs'],
    });

    // Create service repositories and pipelines
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

    serviceNames.forEach(serviceName => {
      // Create CodeCommit repository
      const repository = new codecommit.Repository(this, `${serviceName}-repo`, {
        repositoryName: `pageflow-${serviceName}`,
        description: `Repository for Pageflow ${serviceName}`,
      });

      // Create ECR repository
      const ecrRepo = new ecr.Repository(this, `${serviceName}-ecr`, {
        repositoryName: `pageflow/${serviceName}`,
        imageScanOnPush: true,
        lifecycleRules: [
          {
            maxImageCount: 5,
            description: 'Keep only the 5 most recent images',
          },
        ],
      });

      // Create CodeBuild project
      const buildProject = new codebuild.PipelineProject(this, `${serviceName}-build`, {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          privileged: true, // Required for Docker commands
        },
        environmentVariables: {
          REPOSITORY_URI: {
            value: ecrRepo.repositoryUri,
          },
          ENVIRONMENT: {
            value: props.environmentName,
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
                'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                'IMAGE_TAG=${COMMIT_HASH:=latest}',
                'npm ci',
              ],
            },
            build: {
              commands: [
                'echo Running tests...',
                'npm test',
                'echo Building Docker image...',
                'docker build -t $REPOSITORY_URI:latest .',
                'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
              ],
            },
            post_build: {
              commands: [
                'echo Pushing Docker image...',
                'docker push $REPOSITORY_URI:latest',
                'docker push $REPOSITORY_URI:$IMAGE_TAG',
                'echo Writing image definitions file...',
                'echo \'{"ImageURI":"\'$REPOSITORY_URI:$IMAGE_TAG\'"}\'> imageDefinitions.json',
              ],
            },
          },
          artifacts: {
            files: [
              'imageDefinitions.json',
            ],
          },
        }),
      });

      // Grant ECR permissions to CodeBuild
      ecrRepo.grantPullPush(buildProject.grantPrincipal);

      // Create pipeline
      const pipeline = new codepipeline.Pipeline(this, `${serviceName}-pipeline`, {
        pipelineName: `pageflow-${serviceName}-${props.environmentName}`,
        artifactBucket: this.artifactBucket,
        restartExecutionOnUpdate: true,
      });

      // Add source stage
      const sourceOutput = new codepipeline.Artifact();
      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'CodeCommit',
            repository,
            output: sourceOutput,
            branch: 'main',
          }),
        ],
      });

      // Add build stage
      const buildOutput = new codepipeline.Artifact();
      pipeline.addStage({
        stageName: 'Build',
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: 'BuildAndTest',
            project: buildProject,
            input: sourceOutput,
            outputs: [buildOutput],
          }),
        ],
      });

      // Add deploy stage (using ECS deployment)
      pipeline.addStage({
        stageName: 'Deploy',
        actions: [
          // TODO: Fix ECS deployment action
          // new codepipeline_actions.EcsDeployAction({
          //   actionName: 'DeployToECS',
          //   service: `pageflow-${serviceName}`,
          //   imageFile: buildOutput.atPath('imageDefinitions.json'),
          // }),
        ],
      });

      // Add notification for pipeline state changes
      pipeline.notifyOn('PipelineStateChange', this.notificationTopic, {
        events: [
          codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
          codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
          codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,
        ],
        detailType: cdk.aws_codestarnotifications.DetailType.FULL,
      });
    });

    // Create web frontend pipeline
    const webRepository = new codecommit.Repository(this, 'web-frontend-repo', {
      repositoryName: 'pageflow-web-frontend',
      description: 'Repository for Pageflow web frontend',
    });

    const webBuildProject = new codebuild.PipelineProject(this, 'web-frontend-build', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      environmentVariables: {
        ENVIRONMENT: {
          value: props.environmentName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo Running tests...',
              'npm test',
              'echo Building application...',
              'npm run build',
            ],
          },
        },
        artifacts: {
          'base-directory': 'build',
          files: [
            '**/*',
          ],
        },
      }),
    });

    const webPipeline = new codepipeline.Pipeline(this, 'web-frontend-pipeline', {
      pipelineName: `pageflow-web-frontend-${props.environmentName}`,
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: true,
    });

    const webSourceOutput = new codepipeline.Artifact();
    webPipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository: webRepository,
          output: webSourceOutput,
          branch: 'main',
        }),
      ],
    });

    const webBuildOutput = new codepipeline.Artifact();
    webPipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndTest',
          project: webBuildProject,
          input: webSourceOutput,
          outputs: [webBuildOutput],
        }),
      ],
    });

    // Add notification for web pipeline state changes
    webPipeline.notifyOn('WebPipelineStateChange', this.notificationTopic, {
      events: [
        codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
        codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
        codepipeline.PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,
      ],
      detailType: cdk.aws_codestarnotifications.DetailType.FULL,
    });

    // Output the artifact bucket name
    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'The name of the S3 bucket for pipeline artifacts',
      exportName: `${props.environmentName}-artifact-bucket-name`,
    });

    // Output the CodeArtifact domain name
    new cdk.CfnOutput(this, 'CodeArtifactDomainName', {
      value: this.codeArtifactDomain.domainName,
      description: 'The name of the CodeArtifact domain',
      exportName: `${props.environmentName}-codeartifact-domain-name`,
    });

    // Output the CodeArtifact repository name
    new cdk.CfnOutput(this, 'CodeArtifactRepositoryName', {
      value: this.codeArtifactRepository.repositoryName,
      description: 'The name of the CodeArtifact repository',
      exportName: `${props.environmentName}-codeartifact-repository-name`,
    });
  }
}