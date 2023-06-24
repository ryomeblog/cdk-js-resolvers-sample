const awsconfig = {
    Auth: {
        region: '【リージョン】',
        userPoolId: '【UserPoolId】',
        userPoolWebClientId: '【UserPoolWebClientId】',
        oauth: {
            domain: '【UserPoolDomain】',
            scope: ['openid'],
            redirectSignIn: '【CloudFrontURL】',
            redirectSignOut: '【CloudFrontURL】',
            responseType: 'code'
        }
    },
    aws_appsync_graphqlEndpoint: '【GraphQLEndpoint】',
    aws_appsync_region: '【リージョン】',
    aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
    aws_appsync_apiKey: "null"
};

export default awsconfig;