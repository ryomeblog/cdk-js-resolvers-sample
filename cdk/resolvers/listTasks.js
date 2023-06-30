import { util } from '@aws-appsync/utils';
export function request(ctx) {
  console.log('-----listTasks start-----');
  return {};
}
export function response(ctx) {
  console.log('-----listTasks end-----');
  return ctx.prev.result;
}