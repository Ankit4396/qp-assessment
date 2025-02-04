import {Joi,Common,_} from "../config/routeImporter";
import {userObject,categoryObject,parenetCategory,categoryTypeObject,attachmentObject} from "./relations";

const categoryRequest:  Joi.ObjectSchema = Joi.object().keys({
    name: Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'CATEGORY_NAME_IS_REQUIRED')}).example("Category name").description('Category name (must be unique for category type)'),
    categorytypeCode: Joi.string().trim().optional().example(1).description('permission,post,page,directory').allow(null,""),
    categorytypeId: Joi.number().example(1).description('Category Id').optional().allow(null),
    parentId: Joi.number().example(1).description('Select parent category id (default is null)').optional().allow(null).default(null),
    imageId:Joi.number().optional().allow(null).example(1).description('Attachment id to be associated with category').default(null),
}).label('category-request').description('Create object for category')

const updateRequest:  Joi.ObjectSchema = Joi.object().keys({
    name: Joi.string().trim().description('Category name (must be unique for category type)').optional().allow(null,""),
    categorytypeCode: Joi.string().trim().optional().example(1).description('permission,post,page,directory').allow(null,""),
    categorytypeId: Joi.number().example(1).description('Category Id').optional().allow(null),
    parentId: Joi.number().example(1).description('Select parent category id (default is null)').optional().allow(null).default(null),
    imageId:Joi.number().optional().allow(null).example(1).description('Attachment id to be associated with category').default(null).optional().allow(null),
    status:Joi.number().example(1).valid(0,1).description("Activation status").optional().allow(null),
}).label('category-request').description('Create object for category')

const directoryRequest:  Joi.ObjectSchema = Joi.object().keys({
    name: Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'DIRECTORY_NAME_IS_REQUIRED')}).example("Directory name").description('Directory name (must be unique for with in a directory)'),
    categorytypeCode: Joi.string().trim().optional().default('directory').valid('directory'),
    parentId: Joi.number().example(1).description('Select parent directory id (default is null)').optional().allow(null).default(null),
    imageId:Joi.number().optional().allow(null).example(1).description('Attachment id to be associated with directory').default(null)
}).label('category-request').description('Create object for category')

const myDirectoriesRequest:  Joi.ObjectSchema = Joi.object().keys({
    categoryTypeCode: Joi.string().trim().optional().default('directory').valid('directory'),
}).label('my-directories-request').description('Request to get all account directories')

const directorySummary:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the category type"),
    name:Joi.string().example("Category type name").description('Define the group type title'),
}).label('directory-summary').description('Directory summary object')

const myDirectoriesResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:Joi.array().items(directorySummary).min(0).label('categories-listing').description('Array of category objects')
}).label('category-response').description('Category operation response object')

const categoryIdentity:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().required().example(1).description("Unique identifier for the category"),
}).label('category-identiry').description('Identifier for the content type')

const categoryTypeIdentity:  Joi.ObjectSchema = Joi.object().keys({
    categoryTypeCode:Joi.string().required().example(1).description("Unique identifier for the category type (Code of category type)"),
}).label('category-type-identiry').description('Identifier for the category type')

const category:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the category type"),
    code:Joi.string().example('category-code').description("Category code generated by system"),
    name:Joi.string().example("Category type name").description('Define the group type title'),
    categoryImage:attachmentObject.allow(null),
    categorytype:categoryTypeObject,
    level:Joi.number().example(1).description('level'),
    parent:categoryObject.allow(null),
    author:userObject.allow(null),
    updatedBy:userObject.allow(null),
    status:Joi.number().example(1).valid(0,1).description("Activation status"),
    isRevision:Joi.boolean().example(true).allow(null).description("If the entry is stored as revision or not"),
    revisionId:Joi.number().example(1).allow(null).description("Ref to the revision entity"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date")
}).label('category').description('Category object')



const categoryResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:category
}).label('category-response').description('Category operation response object')


const categoryDeletedObj = category.keys({deletedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("Date when record was deleted"),}).label('deleted-category').description('Deleted models for category');

const categoryDeleteResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:categoryDeletedObj
}).label('category-delete-response').description('Category operation response object')

const categoriesResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:Joi.array().items(category).min(0).label('categories-listing').description('Array of category objects')
}).label('categories-response').description('List of all categories in array format')

const listCategoryRequest:  Joi.ObjectSchema = Joi.object().keys({
    page:Joi.number().optional().min(1).default(1),
    parentId:Joi.number().optional().default(null),
    perPage:Joi.number().optional().min(1).default(+process.env.PAGINATION_LIMIT!),
    type:Joi.string().optional().example('post,page,permission,business-type,parcel').description("Type of category to be listed (business-type,post,page,permission,parcel)"),
    categoryTypeId:Joi.number().optional().example('id of category type').description("Type of category to be listed (business-type,post,page,permission,parcel)"),
    searchText:Joi.string().optional().example('category name').description("category name"),
    showRevisions:Joi.boolean().optional().default(false).valid(true,false).example(false).description("If request is to list all category types or revisions of a category. For revisions id is required parameter"),
}).label('category-list-request').description('Category list request with filters')

const listCategoryResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData:Joi.object().keys({
        parentHirarchy:Joi.array().items(parenetCategory).min(0).description('Array of parent objects'),
        data:Joi.array().items(category).min(0).description('Array of category type objects'),
        perPage:Joi.number().example(1).description("Number or required in response"),
        page:Joi.number().example(1).description("page no for which data is requested"),
        totalPages:Joi.number().example(1).description("Total number of pages response set will generate")
    }).label('category-list-responseData').description('Category list response data object')
}).label('category-list-response').description('Category list response')

const categoryStatusRequest :  Joi.ObjectSchema =  Joi.object().keys({
    status:Joi.boolean().required().error(errors=>{return Common.routeError(errors,'CATEGORY_STATUS_IS_REQUIRED')}).valid(true,false).description("Status of the category type")
}).label('category-status-request').description("Request to update the status of the category")

export{
    category,
    categoryIdentity,
    categoryTypeIdentity,
    categoryDeleteResponse,
    categoryRequest,
    categoryResponse,
    directoryRequest,
    categoriesResponse,
    categoryStatusRequest,
    listCategoryRequest,
    listCategoryResponse,
    myDirectoriesRequest,
    myDirectoriesResponse,
    updateRequest
}