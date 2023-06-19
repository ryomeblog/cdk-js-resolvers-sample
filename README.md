# CDK JavaScript Resolver Sample
このリポジトリは、CDKでJSリゾルバーを作成するサンプルコードです。
サンプルコードとしてCognito認証付きのToDoリストアプリを作成しました。

## 環境

**使用技術とバージョン**

| 技術 | バージョン |
| --- | --- |
| Node.js | v18.12.1 |
| CDK | 2.84.0 |
| React | 18.2.0 |

# インフラ構成図

![](./img/infrastructure.drawio.png)

# シーケンス図

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant React as Reactアプリ
    participant Cognito as AWS Cognito
    participant AppSync as AWS AppSync
    participant DynamoDB as AWS DynamoDB

    Note over User,DynamoDB : 【初回起動時】
    User->>React: ページ読み込み
    React-->>User: 初回ページを描画
    
    Note over User,DynamoDB : 【ログイン】
    User->>React: "ログイン"ボタンをクリック
    React->>Cognito: ユーザの認証情報を要求
    Cognito-->>User: ログイン情報の入力を要求
    User->>Cognito: ログイン情報を入力
    Cognito-->>React: 認証済みユーザーを返す
    React->>AppSync: タスク一覧を要求
    AppSync->>DynamoDB: タスクを取得
    DynamoDB-->>AppSync: タスクを返す
    AppSync-->>React: タスクを返す
    React-->>User: タスクを描画

    Note over User,DynamoDB : 【タスク作成】
    User->>React: 新規タスクのタイトルと説明を入力
    React-->>User: 新規タスクのタイトルと説明を描画
    User->>React: "New Task"ボタンをクリック
    React->>AppSync: タスク作成を要求
    AppSync->>DynamoDB: 新規タスクを作成
    DynamoDB-->>AppSync: 作成したタスクを返す
    AppSync-->>React: 作成したタスクを返す
    React->>AppSync: タスク一覧を要求
    AppSync->>DynamoDB: タスクを取得
    DynamoDB-->>AppSync: タスクを返す
    AppSync-->>React: タスクを返す
    React-->>User: タスクを描画

    Note over User,DynamoDB : 【タスク完了】
    User->>React: "Not completed"ボタンをクリック
    React->>AppSync: タスク更新を要求
    AppSync->>DynamoDB: 既存のタスクを更新
    DynamoDB-->>AppSync: 更新したタスクを返す
    AppSync-->>React: 更新したタスクを返す
    React->>AppSync: タスク一覧を要求
    AppSync->>DynamoDB: タスクを取得
    DynamoDB-->>AppSync: タスクを返す
    AppSync-->>React: タスクを返す
    React-->>User: タスクを描画

    Note over User,DynamoDB : 【タスク削除】
    User->>React: "Delete"ボタンをクリック
    React->>AppSync: タスク削除を要求
    AppSync->>DynamoDB: 既存のタスクを削除
    DynamoDB-->>AppSync: 削除したタスクを返す
    AppSync-->>React: 削除したタスクを返す
    React->>AppSync: タスク一覧を要求
    AppSync->>DynamoDB: タスクを取得
    DynamoDB-->>AppSync: タスクを返す
    AppSync-->>React: タスクを返す
    React-->>User: タスクを描画
```

# 参考文献
- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_appsync-readme.html#js-functions-and-resolvers
- https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-reference-overview-js.html
- https://aws.amazon.com/jp/blogs/news/getting-started-with-javascript-resolvers-in-aws-appsync-graphql-apis/


