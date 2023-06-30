import { util } from '@aws-appsync/utils';
export function request(ctx) {
  console.log('-----updateTaskFn start-----');
  const { ToDoID, title, description, completed } = ctx.args.input
  let expressionTxt = 'SET ';
  let expressionNames = {};
  let expressionValues = {};

  if (!!title) {
    expressionTxt += '#title = :title,';
    expressionNames['#title'] = 'title';
    expressionValues[':title'] = { 'S': title }
  }

  if (!!description) {
    expressionTxt += '#description = :description,';
    expressionNames['#description'] = 'description';
    expressionValues[':description'] = { 'S': description }
  }

  if (!!completed) {
    expressionTxt += '#completed = :completed,';
    expressionNames['#completed'] = 'completed';
    expressionValues[':completed'] = { 'BOOL': completed }
  }

  expressionTxt = expressionTxt.substring(0, expressionTxt.length - 1);

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ ToDoID }),
    update: {
      expression: expressionTxt,
      expressionNames: expressionNames,
      expressionValues: expressionValues,
    },
  };
}
export function response(ctx) {
  console.log('-----updateTaskFn end-----');
  return ctx.result;
}