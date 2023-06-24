#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack.js';

const appname = 'Sample';
const webdeploy = false;

const app = new cdk.App();
new CdkStack(app, 'CdkStack', {appname, webdeploy});
