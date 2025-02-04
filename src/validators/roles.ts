import {Joi,Common,_} from "../config/routeImporter"
import {userObject,permissionObject} from "./relations"

const role:  Joi.ObjectSchema  = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the permission"),
    code:Joi.string().example('permission-code').description("Permission code must match with text used in code"),
    name:Joi.string().example("Permission name").description('Name of the permission'),
    author:userObject.allow(null),
    updatedBy:userObject.allow(null),
    Permissions:Joi.array().items(permissionObject.allow(null)).min(0),
    status:Joi.number().example(1).valid(0,1).description("Activation status"),
    isRevision:Joi.boolean().example(true).allow(null).description("If the entry is stored as revision or not"),
    revisionId:Joi.number().example(1).allow(null).description("Ref to the revision entity"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date")
}).label('role').description('Role');

const roleRequest :  Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'PERMISSION_NAME_IS_REQUIRED')}).example("Permission name").description('Name of the permission'),
    permissions:Joi.array().items(Joi.number()).required().min(1).example("[1,2,3]").description('Permission to be associted with the role')
}).label('role-request').description('Role Request')

const roleResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:role
}).label('role-response').description('Responsedata for create and update role')

const roleObj = role.keys({deletedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("Deleted Role object"),}).label('deleted-role');
const deletedRoleResponse=Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:roleObj
}).label('deleted-role-response').description('Response for delete role')

const roleIdentity :  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().required().example(1).description("Unique identifier for the role"),
}).label('role-identiry').description('Identifier for the role')

const roleFilters :  Joi.ObjectSchema = Joi.object().keys({
    searchText:Joi.string().trim().optional().example("Search text").description("Your serach text"),
    page:Joi.number().min(0).optional().default(1).example(1).description("Page no for paginated data"),
    perPage:Joi.number().optional().min(1).default(+process.env.PAGINATION_LIMIT!),
}).label('role-listing-request').description('Request to generate role listing')

const listResponse :  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:Joi.object().keys({
        data:Joi.array().items(role).min(0).description('Array of role objects'),
        perPage:Joi.number().example(1).description("Number or required in response"),
        page:Joi.number().example(1).description("page no for which data is requested"),
        totalRecords:Joi.number().example(1).description("total number of reccords"),
        totalPages:Joi.number().example(1).description("Total number of pages response set will generate")
    }).label('role-list').description('Role listing')
}).label('role-listing-response').description('Roles listing response')

const roleFiltersWithoutPagination :  Joi.ObjectSchema = Joi.object().keys({
    searchText:Joi.string().trim().optional().example("Search text").description("Your serach text"),
}).label('role-listing-request').description('Request to generate role listing')


export{
    roleIdentity,
    roleRequest,
    roleResponse,
    deletedRoleResponse,
    roleFilters,
    listResponse,
    roleFiltersWithoutPagination
}

