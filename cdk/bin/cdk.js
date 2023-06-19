#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SampleCdkStack } from '../lib/cdk-stack.js';

const app = new cdk.App();
new SampleCdkStack(app, 'SampleCdkStack');
