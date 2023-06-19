// AWS CDKのライブラリと、必要なAWSサービスのライブラリをインポートします。
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

// Stackクラスを拡張してAWSリソースを定義します。
export class SampleCdkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3バケットを作成します。このバケットは静的なウェブサイトのホスティングに使用されます。
    // 'index.html'をウェブサイトのメインページとして、'error.html'をエラーページとして設定します。
    // publicReadAccessはバケットへのパブリックな読み取りアクセスを許可するかどうかを指定します。
    // removalPolicyはこのバケットが削除されるときの振る舞いを指定します。今回はDESTROY（削除）と指定しています。
    const bucket = new s3.Bucket(this, 'SampleBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // バケットへのアクセスを許可するIAMポリシーを作成します。
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.AnyPrincipal()],
      resources: [bucket.arnForObjects('*')],
    });

    // 作成したポリシーをバケットに適用します。
    bucket.addToResourcePolicy(policyStatement);

    // バケットにウェブサイトのファイルをデプロイします。
    // '../web/build'の位置にあるファイルがデプロイの対象となります。
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../web/build')],
      destinationBucket: bucket,
    });

    // CloudFrontのDistributionを作成します。
    // このDistributionは先ほど作成したS3バケットをOrigin（配信元）として設定されます。
    const distribution = new cloudfront.Distribution(this, 'SampleDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });

    // CognitoのUserPoolを作成します。
    // selfSignUpEnabledをtrueに設定することで、ユーザーが自己登録できるようになります。
    // autoVerifyは、ユーザー登録時にEメールアドレスを自動で確認するかどうかを設定します。
    const userPool = new cognito.UserPool(this, 'SampleUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: false },
    });

    // UserPoolに紐づくCognitoのクライアントを作成します。
    // callbackUrlsは、認証後にリダイレクトされるURLを指定します。
    // logoutUrlsは、ログアウト後にリダイレクトされるURLを指定します。
    const userPoolClient = new cognito.UserPoolClient(this, 'SampleUserPoolClient', {
      userPool,
      callbackUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
      logoutUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
    });

    // Cognitoのドメインを作成します。
    // これにより、Cognitoが提供する認証画面をカスタムドメインで利用することができます。
    const userPoolDomain = new cognito.UserPoolDomain(this, 'SampleUserPoolDomain', {
      userPool,
      cognitoDomain: { domainPrefix: 'sampleapp-' + Math.random().toString(36).substring(2, 15) },
    });

    // DynamoDBのテーブルを作成します。
    // このテーブルはToDoアプリケーションのデータを保存するために使用します。
    // ToDoIDをパーティションキー（主キー）として設定します。
    // billingModeは課金の方法を指定します。PAY_PER_REQUESTは読み書きの操作ごとに課金されます。
    const table = new ddb.Table(this, 'SampleTable', {
      partitionKey: { name: 'ToDoID', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // AppSyncのGraphQL APIを作成します。
    // authorizationConfigで認証の設定を行います。ここではCognitoのUserPoolを利用します。
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

    // DynamoDBのテーブルをデータソースとしてAppSync APIに追加します。
    const dataSource = api.addDynamoDbDataSource('SampleDataSource', table);

    // 各リゾルバを定義します。リゾルバはGraphQLのクエリやミューテーションに対応する処理を定義します。
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

    // 各リゾルバに対応するAppSyncのFunctionとResolverを作成します。
    // これらのFunctionとResolverは、リゾルバが指定された操作を行うためのロジックを実行します。
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

    // CloudFormationの出力として各リソースの情報を指定します。
    // これにより、デプロイ後にこれらの情報を簡単に取得できます。
    new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'UserPoolDomain', { value: userPoolDomain.domainName });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolWebClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'GraphQLEndpoint', { value: api.graphqlUrl });
  }
}
