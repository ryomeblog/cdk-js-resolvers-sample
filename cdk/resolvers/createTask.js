import {util} from '@aws-appsync/utils';
export function request(ctx) {
  console.log('-----CreateTask start-----');
    return {};
}
export function response(ctx) {
    console.log('ctx', ctx);
  console.log('-----CreateTask end-----');
    return ctx.prev.result;
}