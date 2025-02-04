import {Common,Joi} from "../config/routeImporter";
import {authorizedheaders,headers,options,validator,respmessage,resp400,resp500} from "../validators/global"
import * as groceryItem from "../controllers/grocery";
import {RouteType} from '../config/interfaces'
import {
    groceryIdentity,
    groceryStatusRequest,
    getGroceryRequest,
    listGroceryRequest,
    addGroceryRequest,
    updateGroceryRequest
} from '../validators/grocery'

const routes: RouteType[]  =[ 
    {
        method: 'POST',
        path: '/groceryItem',
        handler:groceryItem.createGroceryItem,
        options:{
            tags: ["api", "Grocery"],
            notes: "Add a new grocery item along with its variants if present any",
            description: "Add a new grocery item along with its variants if present any",
            auth: { strategies: ['session','jwt'], scope: ['admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: addGroceryRequest,
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
        path: '/groceryItem',
        handler:groceryItem.getById,
        options:{
            tags: ["api", "Grocery"],
            notes: "Get grocery item by id",
            description: "Get grocery item by id",
            auth: false,
            validate: {
                headers: headers,
                query: groceryIdentity,
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
        method: 'PATCH',
        path: '/groceryItem',
        handler:groceryItem.updateGroceryItem,
        options:{
            tags: ["api", "Grocery"],
            notes: "Update a grocery item",
            description: "Update a grocery item",
            auth: { strategies: ['session','jwt'], scope: ['admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: updateGroceryRequest,
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
        path: '/groceryItem',
        handler:groceryItem.deleteById,
        options:{
            tags: ["api", "Grocery"],
            notes: "Delete a grocery item by id",
            description: "Delete a grocery itemby id",
            auth: { strategies: ['session','jwt'], scope: ['admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                query:groceryIdentity,
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
        method: 'PATCH',
        path: '/groceryItem/status',
        handler:groceryItem.updateStatus,
        options:{
            tags: ["api", "Grocery"],
            notes: "Update grocery item status",
            description: "Update grocery item status",
            auth: { strategies: ['session','jwt'], scope: ['admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                query:groceryStatusRequest,
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
        path: '/groceryItem/listAll',
        handler:groceryItem.listAllGroceryItems,
        options:{
            tags: ["api", "Grocery"],
            notes: "List Grocery items with pagination",
            description: "List Grocery items with pagination",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                query:listGroceryRequest,
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
        path: '/groceryItem/getAll',
        handler:groceryItem.getAllGroceryItems,
        options:{
            tags: ["api", "Grocery"],
            notes: "Get all Grocery items  pagination",
            description: "Get all Grocery items  pagination",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                query:getGroceryRequest,
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