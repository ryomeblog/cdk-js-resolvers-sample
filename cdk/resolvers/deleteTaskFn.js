import {util} from '@aws-appsync/utils';
export function request(ctx) {
    console.log('-----DeleteTaskFn start-----');
  const {ToDoID} = ctx.args;
  return {
    operation: 'DeleteItem',
    key: util.dynamodb.toMapValues({ ToDoID }),
  };
}
export function response(ctx) {
    console.log('-----DeleteTaskFn end-----');
    return ctx.result;
}