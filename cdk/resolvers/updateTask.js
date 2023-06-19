import { util } from '@aws-appsync/utils';
export function request(ctx) {
    console.log('-----updateTask start-----');
    return {};
}
export function response(ctx) {
    console.log('-----updateTask end-----');
    return ctx.prev.result;
}