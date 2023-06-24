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
export class CdkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3バケットを作成します。このバケットは静的なウェブサイトのホスティングに使用されます。
    // 'index.html'をウェブサイトのメインページとして、'error.html'をエラーページとして設定します。
    // publicReadAccessはバケットへのパブリックな読み取りアクセスを許可するかどうかを指定します。
    // removalPolicyはこのバケットが削除されるときの振る舞いを指定します。今回はDESTROY（削除）と指定しています。
    const bucket = new s3.Bucket(this, `${props.appname}Bucket`, {
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
    if (props.webdeploy) {
      new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset('../web/build')],
        destinationBucket: bucket,
      });
    }

    // CloudFrontのDistributionを作成します。
    // このDistributionは先ほど作成したS3バケットをOrigin（配信元）として設定されます。
    const distribution = new cloudfront.Distribution(this, `${props.appname}Distribution`, {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });

    // CognitoのUserPoolを作成します。
    // selfSignUpEnabledをtrueに設定することで、ユーザーが自己登録できるようになります。
    // autoVerifyは、ユーザー登録時にEメールアドレスを自動で確認するかどうかを設定します。
    const userPool = new cognito.UserPool(this, `${props.appname}UserPool`, {
      selfSignUpEnabled: true,
      autoVerify: { email: false },
    });

    // UserPoolクライアントを作成し、OAuth設定を行います。
    // ログインとログアウト時のURLを指定します。
    const userPoolClient = userPool.addClient(`${props.appname}UserPoolClient`, {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID],
        callbackUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
        logoutUrls: [`http://localhost:3000`, `https://${distribution.distributionDomainName}`],
      },
    });

    // DynamoDBのテーブルを作成します。
    // このテーブルはToDoアプリケーションのデータを保存するために使用します。
    // ToDoIDをパーティションキー（主キー）として設定します。
    // billingModeは課金の方法を指定します。PAY_PER_REQUESTは読み書きの操作ごとに課金されます。
    const table = new ddb.Table(this, `${props.appname}Table`, {
      partitionKey: { name: 'ToDoID', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // AppSyncのGraphQL APIを作成します。
    // authorizationConfigで認証の設定を行います。ここではCognitoのUserPoolを利用します。
    const api = new appsync.GraphqlApi(this, 'SmpleApi', {
      name: `${props.appname.toLowerCase()}-api`,
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
      },
    });

    // DynamoDBのテーブルをデータソースとしてAppSync APIに追加します。
    const dataSource = api.addDynamoDbDataSource(`${props.appname}DataSource`, table);

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
      const jsFunction = new appsync.AppsyncFunction(this, `${resolver.fieldName}Function`, {
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
        pipelineConfig: [jsFunction],
      });
    }

    // CloudFormationの出力として各リソースの情報を指定します。
    // これにより、デプロイ後にこれらの情報を簡単に取得できます。
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolWebClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'GraphQLEndpoint', { value: api.graphqlUrl });
  }
}
