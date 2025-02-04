import { Models, sequelize } from "../models";
import * as Common from './common';
import * as Constants from '../constants';
import Moment from "moment-timezone";
import _, { constant, isArray, remove } from "lodash";
import { Sequelize, Op } from "../config/dbImporter";
import requestIp from 'request-ip';
import * as Hapi from "@hapi/hapi";
import { WhereOptions, where } from "sequelize";
import { Literal, Fn, Json } from "sequelize/types/utils";
import { GroceryItems } from "../config/interfaces";
import Orders from "../models/Order";


type AttributeElement = string | [Literal, string] | [Fn,string] ;

interface items{
    id:number;
    quantity:number;
}


const  itemValidation = async(items:items[],transaction:Sequelize.Transaction)=>{
  try{
    
    let order = []
    let cartTotalValue = 0
    for(let item of items){
        let itemObject = {}
        
        let itemExists = await Models.GroceryItems.findOne({
            where: {
              id: item.id,
              status: 1,
              inStock: 1,
            //   leftQuantity: { [Op.gte]: item.quantity }
            },
            transaction // Move this outside the `where` clause
          });
          
        if(!itemExists){
                return {success:false,message:"Item currently unavailable",statusCode:400}
        }
        itemExists = JSON.parse(JSON.stringify(itemExists))
        if(itemExists?.leftQuantity! < item.quantity){
            return {success:false,message:`Item ${itemExists?.name!}currently left ${itemExists?.leftQuantity!}quantity`,statusCode:400}
        }
        console.log(itemExists?.price!*item.quantity,"====",itemExists)
        itemObject = {itemId:item.id, quantity:item.quantity, price:itemExists?.price!*item.quantity}
        order.push(itemObject)
        cartTotalValue += itemExists?.price!*item.quantity
    }

    return {success:true,message:"Request Processed",statusCode:200,data:{order:order,cartTotalValue:cartTotalValue}}

  }catch(err){
          return {success:false,message:`Something went wrong`,statusCode:500};
  }
}
 
export const fetch = async (id: number) => {
    try {
     
       let record = await Models.Orders.findOne({
        include:[
            {
                model:Models.OrderDetails,
                as:"orderDetails",
                include:[
                    {
                        model:Models.GroceryItems,
                        as:"groceryItems"

                    }
                ]
            }
        ],
        where:{id:id}
       })
        return record;
    } catch (error) {
        console.error('Error fetching record:', error);
        return false;
    }
};

export const getById = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try {
        // const userId = request.auth.credentials.userData.id;
        const {  id } = request.query as {  id: number };

        const record = await fetch(id)
        if (!record) {
            //await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID', {});
        }

        return h.response({ message: 'Record deleted successfully', responseData: JSON.parse(JSON.stringify(record)) }).code(200);

    } catch (error) {
        console.log(error);
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
}
export const getAllOrders = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try {
        const userId = request.auth.credentials.userData.id;
        let { perPage, page,status} = request.query
        perPage = +process.env.PAGINATION_LIMIT! < perPage ? +process.env.PAGINATION_LIMIT! : perPage
        let offset = (page - 1) * perPage;
        let lang = request.headers.language



        let where = {[Op.and]:<WhereOptions[]>[]}

        where[Op.and].push({customerId:userId})

        if(status){
            where[Op.and].push({status:status}) 
        }

        let record =await  Models.Orders.findAndCountAll({
            include:[
                {
                    model:Models.OrderDetails,
                    as:"orderDetails",
                    include:[
                        {
                            model:Models.GroceryItems,
                            as:"groceryItems"
                        }
                    ]
                }
            ],
            offset: offset,
            limit: perPage,
            distinct: true,
            order: [['createdAt','DESC']],
            where:where
           })
        if (!record) {
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }
        let totalPages = await Common.getTotalPages(
            record.count,
            request.query.perPage
        );

        return h.response({ message: 'Record  successfully', responseData: {
            data: record.rows,
            totalRecords:record.count,
            totalPages: totalPages,
            perPage: request.query.perPage
        }}).code(200);

    } catch (error) {
        console.log(error);
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
}

export const listAllOrders = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try {
        let { status} = request.query
        const userId = request.auth.credentials.userData.id;
        let where = {[Op.and]:<WhereOptions[]>[]}
        where[Op.and].push({customerId:userId})
        if(status){
            where[Op.and].push({status:status})   
        }
        let record = await Models.Orders.findAll({
            include:[
                {
                    model:Models.OrderDetails,
                    as:"orderDetails",
                    include:[
                        {
                            model:Models.GroceryItems,
                            as:"groceryItems"
    
                        }
                    ]
                }
            ],
            where:where
           })
        if (!record) {
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }
        return h.response({ message: 'Record  successfully', responseData: JSON.parse(JSON.stringify(record))}).code(200);
    } catch (error) {
        console.log(error);
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
}

export const createOrder = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = request.auth.credentials.userData.id;
        // const accountId = request.auth.credentials.userData.accountId;
        const validateAccount = await Models.User.findOne({ where: { id: userId } });
        if (!validateAccount) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_USERTOKEN_PROVIDED_USER_DOES_NOT_EXISTS', {});
        }

        if (validateAccount.status === Constants.STATUS.INACTIVE) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_SUSPENDED_CONTACT_ADMIN', {});
        }

        // if(userId != accountId){
        //     await transaction.rollback();
        //     return Common.generateError(request, 400, 'USER_IS_NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION', {});
        // }
        console.log(request.auth)
        const languageCode = request.headers.language;
        let {items} = request.payload;
        let validateItems = await itemValidation(items,transaction)
        if( !validateItems.success){
            await transaction.rollback()
            return Common.generateError(request, validateItems.statusCode, validateItems.message, {});
        }

        let orderItems = validateItems.data?.order

        let orderCreate = await Models.Orders.create({customerId:userId,cartTotalValue:validateItems.data?.cartTotalValue,cartFinalValue:validateItems.data?.cartTotalValue,isPaid:false})

        if(!orderCreate){
            await transaction.rollback()
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }

        

        orderItems = await orderItems!.map(orderItem => ({ 
            ...orderItem, 
            orderId: orderCreate?.id! 
        }));

        console.log(orderItems)

        let createItem = await Models.OrderDetails.bulkCreate(orderItems!,{transaction})
        if(!createItem){
            await transaction.rollback();
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }
        await transaction.commit();
        let fetchCreatedRecord = await fetch(orderCreate?.id!)
        return h.response({
            message: request.i18n.__('GROCERY_ITEMS_CREATED_SUCCESSFULLY'),
            responseDate: JSON.parse(JSON.stringify(fetchCreatedRecord))
        }).code(200);

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};

export const updateOder = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        console.log(request.auth)
        const userId = request.auth.credentials.userData.id;
        // const accountId = request.auth.credentials.userData.accountId;
        const languageCode = request.headers.language;
        let { orderId,items} = request.payload;
        const validateAccount = await Models.User.findOne({ where: { id: userId } });
        if (!validateAccount) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_USERTOKEN_PROVIDED_USER_DOES_NOT_EXISTS', {});
        }

        if (validateAccount.status === Constants.STATUS.INACTIVE) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_SUSPENDED_CONTACT_ADMIN', {});
        }

        let existingRecord = await Models.Orders.findOne({where:{id:orderId}})
        if(!existingRecord){
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID_RECORD_NOT_FOUND', {});
        }


        existingRecord = JSON.parse(JSON.stringify(existingRecord))

        if(existingRecord?.customerId != userId){
            await transaction.rollback();
            return Common.generateError(request, 403, 'USER_IS_NOT_AUTHORISED_TO_VIEW_THIS', {});
        }
        
        
        if(items.length == 0){
            let destroyOrder = await Orders.destroy({where:{id:orderId},transaction})
            await transaction.commit();
            return h.response({
                message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst('REQUEST_PROCESSED_SUCCESSFULLY')),
                responseData:{},
            }).code(200);
        }

        else{
            let validateItems = await itemValidation(items,transaction)
            if(! validateItems || !validateItems.success){
                await transaction.rollback()
                return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
            }
    
            let orderItems = validateItems.data?.order
            let orderCreate = await Models.Orders.update({cartTotalValue:validateItems.data?.cartTotalValue,cartFinalValue:validateItems.data?.cartTotalValue,isPaid:false},{where:{id:orderId},transaction})

            if(!orderCreate){
                await transaction.rollback()
                return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
            }
    
            
    
            for(let orderItem of orderItems!){
                orderItem = {...orderItem,oderId:orderId!}
            }
            

            //destroy 

            let destroyExistingItems = await Models.OrderDetails.destroy({where:{orderId: orderId},transaction})



            let createItem = await Models.OrderDetails.bulkCreate(orderItems!,{transaction})
            if(!createItem){
                await transaction.rollback();
                return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
            }


            await transaction.commit();
            let updatedRecord = await fetch(orderId)
            return h.response({
                message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst('GROCERY_ITEMS_UPDATED_SUCCESSFULLY')),
                responseData: JSON.parse(JSON.stringify(updatedRecord)),
            }).code(200);
        }
    

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};

export const deleteById = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = request.auth.credentials.userData.id;
        // const accountId = request.auth.credentials.userData.accountId;
        const {id } = request.query;
        const validateAccount = await Models.User.findOne({ where: { id: userId } });
        if (!validateAccount) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_USERTOKEN_PROVIDED_USER_DOES_NOT_EXISTS', {});
        }

        if (validateAccount.status === Constants.STATUS.INACTIVE) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_SUSPENDED_CONTACT_ADMIN', {});
        }

        // if(userId != accountId){
        //     await transaction.rollback();
        //     return Common.generateError(request, 400, 'USER_IS_NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION', {});
        // }

        let existRecord = await Models.Orders.findOne({where:{id:id}})
        if(!existRecord){
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID_RECORD_NOT_FOUND', {});
        }

        existRecord = JSON.parse(JSON.stringify(existRecord))

        await Models.Orders.destroy({where:{id:id},transaction})
        await transaction.commit();
        return h.response({ message: 'Record deleted successfully' }).code(200);

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};


