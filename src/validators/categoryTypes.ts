import {Joi,Common,_} from  "../config/routeImporter"

import {userObject} from "./relations"

const categoryTypeRequest=Joi.object().keys({
    name: Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'CATEGORY_TYPE_NAME_IS_REQUIRED')}).example("Category type name").description('Name of category type'),
    description:Joi.string().optional().allow('').example("Description for the category type").description("Description for the category type"),
    colorIconId:Joi.number().example(1).optional().description("icon id").allow(null).when('visibleAt', {
        is: 1, // If 'visibleAt' is 1
        then: Joi.required().error(errors => Common.routeError(errors, 'CATEGORY_TYPE_COLOR_ICON_ID_IS_REQUIRED')) // 'colorIconId' is required
    }),
    secondaryIconId:Joi.number().example(1).optional().description("icon id").allow(null).when('visibleAt', {
        is: 1, // If 'visibleAt' is 1
        then: Joi.required().error(errors => Common.routeError(errors, 'CATEGORY_TYPE_SECONDARY_ICON_ID_IS_REQUIRED')) // 'secondaryIconId' is required
    }),
    visibleAt:Joi.number().example(1).required().description("visibleAt")
}).label('category-type-request').description('Request to create a category type')

const categoryTypeIdentity=Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'CATEGORY_TYPE_ID_REQUIRED')}).example(1).description("Identifier for the category type"),
}).label('category-type-identiry').description('Identifier for the content type')

const categoryType=Joi.object().keys({
    id:Joi.number().example(1).description("Identifier for the category type"),
    code:Joi.string().example('category-code').description("Code for the category type (Generate by the system)"),
    name:Joi.string().example("Category type name").description('Name of category type'),
    description:Joi.string().example("Description for the category type"),
    userId:Joi.number().example(1).allow(null).description('author`s identity'),
    author:userObject.allow(null),
    updatedBy:userObject.allow(null),
    status:Joi.number().example(1).valid(0,1).description("Activation status 0=>Inactive, 1=>Active"),
    isRevision:Joi.boolean().example(true).allow(null).description("If the entry is stored as revision or not"),
    revisionId:Joi.number().example(1).allow(null).description("ref to the revision entity"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date")
}).label('category-type').description('Category type object')

const categoryTypeResponse=Joi.object().keys({
    message:Joi.string().example("Confirmation message").description("Message to confirm the operation"),
    responseData:categoryType
}).label('category-type-response').description('Category type response object')

const categoryTypeDeleteObj = categoryType.keys({deletedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("Date when record was deleted"),}).label('deleted-category-type').description('Deleted category type object');

const categoryTypeDeleteResponse=Joi.object().keys({
    message:Joi.string().example("Confirmation message").description("Message to confirm the operation"),
    responseData:categoryTypeDeleteObj
}).label('category-type-delete-response').description('Categorytype operation response object')

const categoryTypesResponse=Joi.object().keys({
    message:Joi.string().example("Confirmation message").description("Message to confirm the operation"),
    responseData:Joi.array().items(categoryType).min(0).description('Array of category type objects')
}).label('category-types-response').description('List of all category types in array format')

const filters=Joi.object().keys({
    "searchText":Joi.string().trim().optional().allow(null).description("Search Text")
}).label('categoty-type-filters').description("filters to be applied on listing")

const listCategoryTypeRequest=Joi.object().keys({
    // filters:filters,
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    page:Joi.number().optional().min(1).default(1),
    perPage:Joi.number().optional().min(1).default(+process.env.PAGINATION_LIMIT!),
    showRevisions:Joi.boolean().default(false).valid(true,false).example(false).description("If request is to list all category types or revisions of a category. For revisions id is required parameter"),
    status:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive category types"),
}).label('category-type-list-request').description('Categorytype list request with filters')

const listCategoryTypeResponse=Joi.object().keys({
    message:Joi.string().example("Confirmation message").description("Message to confirm the operation"),
    responseData:Joi.object().keys({
        data:Joi.array().items(categoryType).min(0).description('Array of category type objects'),
        perPage:Joi.number().example(1).description("Number or required in response"),
        page:Joi.number().example(1).description("page no for which data is requested"),
        totalPages:Joi.number().example(1).description("Total number of pages response set will generate")

    }).label('category-type-list-responseData').description('Categorytype list response data object')
}).label('category-type-list-response').description('Categorytype list response')

const categoryTypeStatusRequest = Joi.object().keys({
    status:Joi.boolean().required().error(errors=>{return Common.routeError(errors,'CATEGORY__TYPE_STATUS_IS_REQUIRED')}).valid(true,false).description("Status of the category type")
}).label('category-type-status-request').description("Request to update the status of the category type")


const categoryTypeStatusRequestOptional = Joi.object().keys({
    status:Joi.boolean().required().valid(true,false).description("Status of the category type").optional()
}).label('category-type-status-request').description("Request to update the status of the category type")

const campaignCategoryRequest :  Joi.ObjectSchema =  Joi.object().keys({
    visibleAt:Joi.number().required().valid(1,2,3).description("Visible At").optional(),
    status:Joi.boolean().optional().valid(true,false).description("Status of the category type")
}).label('category-status-request').description("Request to update the status of the category")
export{
    categoryTypeIdentity,
    categoryTypeDeleteResponse,
    categoryTypeRequest,
    categoryTypeResponse,
    categoryTypesResponse,
    categoryTypeStatusRequest,
    listCategoryTypeRequest,
    listCategoryTypeResponse,
    categoryTypeStatusRequestOptional,
    campaignCategoryRequest
}