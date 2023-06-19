import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class SampleCdkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'SampleBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.AnyPrincipal()],
      resources: [bucket.arnForObjects('*')],
    });

    bucket.addToResourcePolicy(policyStatement);

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../web/build')],
      destinationBucket: bucket,
    });

    const distribution = new cloudfront.Distribution(this, 'SampleDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });

    const userPool = new cognito.UserPool(this, 'SampleUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: false },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'SampleUserPoolClient', {
      userPool,
      callbackUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
      logoutUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, 'SampleUserPoolDomain', {
      userPool,
      cognitoDomain: { domainPrefix: 'sampleapp-' + Math.random().toString(36).substring(2, 15) },
    });

    const table = new ddb.Table(this, 'SampleTable', {
      partitionKey: { name: 'ToDoID', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new appsync.GraphqlApi(this, 'SmpleApi', {
      name: 'sampleapi',
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
      },
    });

    const dataSource = api.addDynamoDbDataSource('SampleDataSource', table);

    const resolvers = [
      {
        typeName: 'Query',
        fieldName: 'listTasks'
      },
      {
        typeName: 'Mutation',
        fieldName: 'createTask'
      },
      {
        typeName: 'Mutation',
        fieldName: 'updateTask'
      },
      {
        typeName: 'Mutation',
        fieldName: 'deleteTask'
      },
    ];

    for (const resolver of resolvers) {
      const sampleJsFunction = new appsync.AppsyncFunction(this, `${resolver.fieldName}Function`, {
        name: `${resolver.fieldName}Fn`,
        api: api,
        dataSource: dataSource,
        code: appsync.Code.fromAsset(`resolvers/${resolver.fieldName}Fn.js`),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });

      new appsync.Resolver(this, `${resolver.fieldName}PipelineResolver`, {
        api: api,
        typeName: resolver.typeName,
        fieldName: resolver.fieldName,
        code: appsync.Code.fromAsset(`resolvers/${resolver.fieldName}.js`),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        pipelineConfig: [sampleJsFunction],
      });
    }

    new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'UserPoolDomain', { value: userPoolDomain.domainName });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolWebClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'GraphQLEndpoint', { value: api.graphqlUrl });
  }
}
