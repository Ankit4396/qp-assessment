import {Joi,Common,_} from  "../config/routeImporter"


const groceryIdentity=Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'GROCERY_ITEM_ID_ID_REQUIRED')}).example(1).description("Identifier for the grocery item"),
}).label('category-type-identiry').description('Identifier for the content type')

const getGroceryRequest=Joi.object().keys({
    // filters:filters,
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    page:Joi.number().optional().min(1).default(1),
    perPage:Joi.number().optional().min(1).default(+process.env.PAGINATION_LIMIT!),
    status:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
    inStock:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
}).label('category-type-list-request').description('Categorytype list request with filters')

const listGroceryRequest=Joi.object().keys({
    // filters:filters,
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    status:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
    inStock:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
}).label('category-type-list-request').description('Categorytype list request with filters')

const groceryStatusRequest = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'GROCERY_ITEM_ID_ID_REQUIRED')}).example(1).description("Identifier for the grocery"),
    status:Joi.boolean().required().error(errors=>{return Common.routeError(errors,'CATEGORY__TYPE_STATUS_IS_REQUIRED')}).valid(true,false).description("Status of the grocery")
}).label('category-type-status-request').description("Request to update the status of the grocery item")

const addGroceryRequest = Joi.object()
  .keys({
    name: Joi.string().trim().required().description("Grocery item name"),
    coverImage: Joi.number().optional().allow(null).description("Cover image URL"),
    description: Joi.string().trim().optional().allow(null).description("Grocery item description"),
    overview: Joi.string().trim().optional().allow(null).description("Grocery item overview"),
    quantity: Joi.number().integer().min(0).required().description("Available quantity"),
    inStock: Joi.boolean().required().description("Availability status"),
    price: Joi.number().precision(2).min(0).required().description("Price of the grocery item"),
    isParent: Joi.boolean().required().description("Indicates if this is a parent item"),
    variants: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().trim().required().description("Variant item name"),
          coverImage: Joi.number().optional().allow(null).description("Variant cover image URL"),
          description: Joi.string().trim().optional().allow(null).description("Variant description"),
          overview: Joi.string().trim().optional().allow(null).description("Variant overview"),
          quantity: Joi.number().integer().min(0).required().description("Available quantity for variant"),
          inStock: Joi.boolean().required().description("Availability status of variant"),
          price: Joi.number().precision(2).min(0).required().description("Price of the variant"),
        //   isParent: Joi.boolean().valid(false).required().description("Variant should always be false for isParent"),
        //   parentId: Joi.number().integer().required().description("ID of the parent grocery item"),
        })
      )
      .optional()
      .allow(null)
      .description("List of variant items"),
  })
  .label("grocery-create-request")
  .description("Grocery create request");



  const updateGroceryRequest = Joi.object()
  .keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'GROCERY_ITEM_ID_ID_REQUIRED')}).example(1).description("Identifier for the grocery"),
    name: Joi.string().trim().optional().description("Grocery item name"),
    coverImage: Joi.number().optional().allow(null).description("Cover image URL"),
    description: Joi.string().trim().optional().allow(null).description("Grocery item description"),
    overview: Joi.string().trim().optional().allow(null).description("Grocery item overview"),
    quantity: Joi.number().integer().min(0).optional().description("Available quantity"),
    inStock: Joi.boolean().optional().description("Availability status"),
    price: Joi.number().precision(2).min(0).optional().description("Price of the grocery item"),
    // isParent: Joi.boolean().required().description("Indicates if this is a parent item"),
    variants: Joi.array()
      .items(
        Joi.object().keys({
          id:Joi.number().optional().example(1).description("Identifier for the grocery"),
          name: Joi.string().trim().required().description("Variant item name"),
          coverImage: Joi.number().optional().allow(null).description("Variant cover image URL"),
          description: Joi.string().trim().optional().allow(null).description("Variant description"),
          overview: Joi.string().trim().optional().allow(null).description("Variant overview"),
          quantity: Joi.number().integer().min(0).required().description("Available quantity for variant"),
          inStock: Joi.boolean().required().description("Availability status of variant"),
          price: Joi.number().precision(2).min(0).required().description("Price of the variant"),
        //   isParent: Joi.boolean().valid(false).required().description("Variant should always be false for isParent"),
        //   parentId: Joi.number().integer().required().description("ID of the parent grocery item"),
        })
      )
      .optional()
      .allow(null)
      .description("List of variant items"),
  })
  .label("grocery-create-request")
  .description("Grocery create request");



export{
    groceryIdentity,
    groceryStatusRequest,
    getGroceryRequest,
    listGroceryRequest,
    addGroceryRequest,
    updateGroceryRequest
}