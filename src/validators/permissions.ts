import {Joi,Common,_} from "../config/routeImporter"
const {categoryObject,userObject}=require("./relations")

const permission: Joi.ObjectSchema=Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the permission"),
    code:Joi.string().example('permission-code').description("Permission code must match with text used in code"),
    name:Joi.string().example("Permission name").description('Name of the permission'),
    description:Joi.string().example("Permission description").description('Description of the permission'),
    author:userObject.allow(null),
    updatedBy:userObject.allow(null),
    userId:Joi.number().example(1).allow(null).description('Author`s identity'),
    status:Joi.number().example(1).valid(0,1).description("Activation status"),
    isRevision:Joi.boolean().example(true).allow(null).description("If the entry is stored as revision or not"),
    revisionId:Joi.number().example(1).allow(null).description("Ref to the revision entity"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date")
}).label('permission').description('Permission');

const permissionRequest: Joi.ObjectSchema=Joi.object().keys({
    code:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'PERMISSION_CODE_IS_REQUIRED')}).example('permission-code').description("Permission code must match with text used in code"),
    name:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'PERMISSION_NAME_IS_REQUIRED')}).example("Permission name").description('Name of the permission'),
    description:Joi.string().optional().allow(null,'').trim().example("Permission description").description('Description of the permission'),
    adminOnly:Joi.boolean().optional().default(false).example(false).description('If permission is admin exclusive only')
}).label('permission').description('Permission')

const permissionResponse: Joi.ObjectSchema=Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:permission
}).label('permission-response').description('Response for create and update permission')


const permissionIdentity: Joi.ObjectSchema=Joi.object().keys({
    id:Joi.number().required().example(1).description("Unique identifier for the permission"),
}).label('permission-identiry').description('Identifier for the permission')


module.exports={
    permission,
    permissionIdentity,
    permissionRequest,
    permissionResponse
}

