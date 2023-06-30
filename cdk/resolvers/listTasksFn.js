import { util } from '@aws-appsync/utils';
export function request(ctx) {
  console.log('-----listTasksFn start-----');
  return {
    operation: 'Scan',
  };
}
export function response(ctx) {
  console.log('-----listTasksFn end-----');
  return ctx.result.items;
}