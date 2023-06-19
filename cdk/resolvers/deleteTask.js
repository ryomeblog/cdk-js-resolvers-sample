import {util} from '@aws-appsync/utils';
export function request(ctx) {
    console.log('-----DeleteTask start-----');
    return {};
}
export function response(ctx) {
    console.log('-----DeleteTask end-----');
    return ctx.prev.result;
}