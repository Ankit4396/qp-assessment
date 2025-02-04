'use strict';
import * as appVersion from "../controllers/appVersion";
import {Common,Joi} from '../config/routeImporter';
import {appVersionRequest,appVersionResponse} from "../validators/appVersion";
import {RouteType} from '../config/interfaces';
const validator = Joi;
const {authorizedheaders,optional_authorizedheaders,headers,options,respmessage,resp400,resp500}=require("../validators/global")
const routes: RouteType[]  = [
    {
        method: 'GET',
        path: '/app_version',
        handler:appVersion.getAppVersion,
        options:{
            tags: [
                "api", "APP VERSION", 
            ],
            notes: "Version of Application",
            description: "APP Version info",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                failAction: async (req, h, err) => {
                  return Common.FailureError(err, req);
                },
                validator: validator,
              },
            response: {
                status: {
                    200: appVersionResponse

                }
            } 
        }
    },
    {
        method: 'POST',
        path: '/app_version',
        handler:appVersion.setAppVersion,
        options:{
            tags: [
                "api", "APP VERSION", 
            ],
            notes: "Version of Application",
            description: "APP Version info",
            auth: { strategies: ['session','jwt'], scope: ['admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: appVersionRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    200: appVersionResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
]
module.exports = routes