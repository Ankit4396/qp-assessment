declare module "jsonwebtoken";
declare module "hapi-i18n";
declare module "@hapi/cookie"
declare module "node-cache"
declare module "crypto-js"
declare module "hapi-auto-routes"
declare module "tcp-ping-port"
declare module "file-system"
declare module 'iso-639-1' {
    export function getName(code: string): string | undefined;
    export function getAllNames(): string[];
    export function getCode(name: string): string | undefined;
    export function validate(code: string): boolean;
    // Add other method declarations if needed
}declare module globalThis {
    var io: any;
}

