import {Joi,Common,_} from  "../config/routeImporter"

const orderIdentity=Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'GROCERY_ITEM_ID_ID_REQUIRED')}).example(1).description("Identifier for the grocery item"),
}).label('category-type-identiry').description('Identifier for the content type')

const getOrderRequest=Joi.object().keys({
    page:Joi.number().optional().min(1).default(1),
    perPage:Joi.number().optional().min(1).default(+process.env.PAGINATION_LIMIT!),
    status:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
}).label('category-type-list-request').description('Categorytype list request with filters')

const listOrderRequest=Joi.object().keys({
   
    status:Joi.boolean().valid(true,false).example(true).description("Get only active or inactive grocery items"),
}).label('category-type-list-request').description('Categorytype list request with filters')

const addOrderRequest = Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.number().required().allow(null).description("item id "),
          quantity: Joi.number().required().allow(null).description("item quantity"),
        })
      )
      .required()
      .min (1)
      .description("List of  items"),
  }).label("order-create-request").description("order create request");

const updateOrderRequest = Joi.object().keys({
    orderId: Joi.number()
      .required()
      .error(errors => Common.routeError(errors, 'GROCERY_ITEM_ID_ID_REQUIRED'))
      .example(1)
      .description("Identifier for the grocery"),

    items: Joi.alternatives().try(
      Joi.array().items(
        Joi.object().keys({
          id: Joi.number().allow(null).description("item id"),
          quantity: Joi.number().allow(null).description("item quantity"),
        })
      ).allow(null), // Allow empty array or null
    )
    .optional()
    .description("List of items"),
  }).label("grocery-create-request").description("Grocery create request");

export{
    orderIdentity,
    getOrderRequest,
    listOrderRequest,
    addOrderRequest,
    updateOrderRequest
}