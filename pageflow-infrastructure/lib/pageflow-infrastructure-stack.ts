import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './stacks/network-stack';
import { StorageStack } from './stacks/storage-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { CICDStack } from './stacks/cicd-stack';
import { SecurityStack } from './stacks/security-stack';

export interface PageflowInfrastructureStackProps extends cdk.StackProps {
  environmentName: string;
  adminEmail: string;
  alarmEmail: string;
}

export class PageflowInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PageflowInfrastructureStackProps) {
    super(scope, id, props);

    // Create Network Stack
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentName: props.environmentName,
    });

    // Create Security Stack
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentName: props.environmentName,
      adminEmail: props.adminEmail,
    });

    // Create Storage Stack
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentName: props.environmentName,
      vpc: networkStack.vpc,
    });

    // Create Compute Stack
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentName: props.environmentName,
      vpc: networkStack.vpc,
    });

    // Create Monitoring Stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentName: props.environmentName,
      vpc: networkStack.vpc,
      alarmEmail: props.alarmEmail,
    });

    // Create CI/CD Stack
    const cicdStack = new CICDStack(this, 'CICDStack', {
      environmentName: props.environmentName,
      notificationEmail: props.alarmEmail,
    });

    // Add dependencies between stacks
    storageStack.addDependency(networkStack);
    computeStack.addDependency(networkStack);
    computeStack.addDependency(securityStack);
    monitoringStack.addDependency(networkStack);
    monitoringStack.addDependency(computeStack);
    cicdStack.addDependency(computeStack);
  }
}
