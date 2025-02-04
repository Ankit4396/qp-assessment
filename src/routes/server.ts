'use strict';
import * as server from "../controllers/server";
import {Common,Joi} from '../config/routeImporter';
import {status} from "../validators/server";
import {RouteType} from '../config/interfaces';
const {authorizedheaders,optional_authorizedheaders,headers,options,validator,respmessage,resp400,resp500}=require("../validators/global")
const routes: RouteType[]  = [
    {
        method: 'GET',
        path: '/',
        handler:server.status,
        options:{
            tags: [
                "api", "Server"
            ],
            notes: "Verification if server is running or not",
            description: "server info",
            auth: false,
            response: {
                status: {
                    200: status
                }
            },
            validate: {
                headers: headers,
                options: options,
                failAction: async (req, h, err) => {
                  return Common.FailureError(err, req);
                },
                validator: Joi,
              },
        }
    }
]
module.exports = routes