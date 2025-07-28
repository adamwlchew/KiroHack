import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentName: string;
  adminEmail: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly encryptionKey: kms.Key;
  public readonly guardDutyDetector: guardduty.CfnDetector;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for Pageflow ${props.environmentName}`,
      alias: `alias/pageflow-${props.environmentName}`,
    });

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `pageflow-${props.environmentName}-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        accessibilityPreferences: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add domain to user pool
    const userPoolDomain = this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `pageflow-${props.environmentName}`,
      },
    });

    // Create User Pool Client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: `pageflow-${props.environmentName}-client`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://pageflow-${props.environmentName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
          'http://localhost:3000/callback',
        ],
        logoutUrls: [
          'http://localhost:3000/logout',
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Create Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `pageflow_${props.environmentName}_identity_pool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // Create IAM roles for authenticated and unauthenticated users
    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Add basic permissions for authenticated users
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [
          `arn:aws:s3:::pageflow-${props.environmentName}-user-content/\${cognito-identity.amazonaws.com:sub}/*`,
        ],
      })
    );

    // Attach roles to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // Create admin user group
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Administrators',
      description: 'Administrators group with elevated permissions',
    });

    // Create educator user group
    const educatorGroup = new cognito.CfnUserPoolGroup(this, 'EducatorGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Educators',
      description: 'Educators group with content management permissions',
    });

    // Create learner user group
    const learnerGroup = new cognito.CfnUserPoolGroup(this, 'LearnerGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Learners',
      description: 'Learners group with standard permissions',
    });

    // Create admin user
    const adminUser = new cognito.CfnUserPoolUser(this, 'AdminUser', {
      userPoolId: this.userPool.userPoolId,
      username: 'admin',
      userAttributes: [
        {
          name: 'email',
          value: props.adminEmail,
        },
        {
          name: 'email_verified',
          value: 'true',
        },
        {
          name: 'custom:role',
          value: 'admin',
        },
      ],
    });

    // Add admin user to admin group
    new cognito.CfnUserPoolUserToGroupAttachment(this, 'AdminUserToGroupAttachment', {
      userPoolId: this.userPool.userPoolId,
      groupName: adminGroup.groupName!,
      username: adminUser.username!,
    });

    // Create secrets in Secrets Manager
    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: `pageflow/${props.environmentName}/api-key`,
      description: 'API key for Pageflow services',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ keyName: 'pageflow-api-key' }),
        generateStringKey: 'keyValue',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      encryptionKey: this.encryptionKey,
    });

    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DbCredentialsSecret', {
      secretName: `pageflow/${props.environmentName}/db-credentials`,
      description: 'Database credentials for Pageflow services',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'pageflow_app' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      encryptionKey: this.encryptionKey,
    });

    const bedrockApiKeySecret = new secretsmanager.Secret(this, 'BedrockApiKeySecret', {
      secretName: `pageflow/${props.environmentName}/bedrock-api-key`,
      description: 'API key for AWS Bedrock service',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ keyName: 'bedrock-api-key' }),
        generateStringKey: 'keyValue',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      encryptionKey: this.encryptionKey,
    });

    // Enable GuardDuty
    this.guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: {
          enable: true,
        },
        kubernetes: {
          auditLogs: {
            enable: true,
          },
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: true,
          },
        },
      },
    });

    // Store configuration in SSM Parameter Store
    new ssm.StringParameter(this, 'UserPoolIdParameter', {
      parameterName: `/pageflow/${props.environmentName}/user-pool-id`,
      stringValue: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParameter', {
      parameterName: `/pageflow/${props.environmentName}/user-pool-client-id`,
      stringValue: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'IdentityPoolIdParameter', {
      parameterName: `/pageflow/${props.environmentName}/identity-pool-id`,
      stringValue: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'KmsKeyArnParameter', {
      parameterName: `/pageflow/${props.environmentName}/kms-key-arn`,
      stringValue: this.encryptionKey.keyArn,
      description: 'KMS Key ARN',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output the User Pool ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
      exportName: `${props.environmentName}-user-pool-id`,
    });

    // Output the User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client',
      exportName: `${props.environmentName}-user-pool-client-id`,
    });

    // Output the Identity Pool ID
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'The ID of the Cognito Identity Pool',
      exportName: `${props.environmentName}-identity-pool-id`,
    });

    // Output the KMS Key ARN
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.encryptionKey.keyArn,
      description: 'The ARN of the KMS Key',
      exportName: `${props.environmentName}-kms-key-arn`,
    });

    // Output the User Pool Domain
    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'The domain name of the Cognito User Pool',
      exportName: `${props.environmentName}-user-pool-domain`,
    });
  }
}