import { util } from '@aws-appsync/utils';
export function request(ctx) {
  console.log('-----createTaskFn start-----');
  const { title, description } = ctx.args.input
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ 'ToDoID': util.autoUlid() }),
    attributeValues: util.dynamodb.toMapValues({
      'type': 'todo',
      'title': title,
      'description': description,
      'completed': false,
      'ownerId': ctx.identity.sub
    }),
  };
}
export function response(ctx) {
  console.log('-----createTaskFn end-----');
  return ctx.result;
}