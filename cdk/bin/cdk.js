#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { SampleCdkStack } from '../lib/cdk-stack.js';
import { SampleCdkStack } from '../lib/cdk-cloudfront-s3.js';

const app = new cdk.App();
new SampleCdkStack(app, 'development-cloudfront-s3');
