import {Common,Joi} from "../config/routeImporter";
import {authorizedheaders,headers,options,validator,respmessage,resp400,resp500} from "../validators/global"
import * as order from "../controllers/cartAndOrder";
import {RouteType} from '../config/interfaces'
import {
    orderIdentity,
    getOrderRequest,
    listOrderRequest,
    addOrderRequest,
    updateOrderRequest
} from '../validators/order'

const routes: RouteType[]  =[ 
    {
        method: 'POST',
        path: '/order',
        handler:order.createOrder,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "create a new order",
            description: "create a new order",
            auth: { strategies: ['session','jwt'], scope: ['user'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: addOrderRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: categoryTypeResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/order',
        handler:order.getById,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "Get order by id",
            description: "Get order by id",
            auth: false,
            validate: {
                headers: headers,
                query: orderIdentity,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: categoryTypeResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'PUT',
        path: '/order',
        handler:order.updateOder,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "Update a order",
            description: "Update a order",
            auth: { strategies: ['session','jwt'], scope: ['user'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: updateOrderRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: categoryTypeResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'DELETE',
        path: '/order',
        handler:order.deleteById,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "Delete a order by id",
            description: "Delete a order by id",
            auth: { strategies: ['session','jwt'], scope: ['user'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                query:orderIdentity,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: categoryTypeDeleteResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/order/listAll',
        handler:order.listAllOrders,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "List order with pagination",
            description: "List order with pagination",
            auth: { strategies: ['session','jwt'], scope: ['user'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                query:listOrderRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: listCategoryTypeResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/order/getAll',
        handler:order.getAllOrders,
        options:{
            tags: ["api", "Cart And Orders"],
            notes: "Get all order  pagination",
            description: "Get all order  pagination",
            auth: { strategies: ['session','jwt'], scope: ['user'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                query:getOrderRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    // 200: categoryTypesResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    }
]
module.exports = routes;