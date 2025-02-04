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


type AttributeElement = string | [Literal, string] | [Fn,string] ;


const removeUndefinedFields = async <T>(obj: T): Promise<Partial<T>> => {
    const newObj: Partial<T> = {};
    for (const key in obj) {
        if (obj[key as keyof T] !== undefined) {
            newObj[key as keyof T] = obj[key as keyof T];
        }
    }
    return newObj;
};
 
export const fetch = async (id: number) => {
    try {
     
       let record = await Models.GroceryItems.findOne(
        {   
            include:[
                {
                   model: Models.GroceryItems,
                   as:"variants",
                   required:false,
                },
                {
                    model: Models.GroceryItems,
                    as: "parent",
                    required: false 
                }
              ],

            where: {id: id}
        }
        )

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
export const getAllGroceryItems = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try {
        // const userId = request.auth.credentials.userData.id;
        let { perPage, page,searchText,inStock} = request.query
        perPage = +process.env.PAGINATION_LIMIT! < perPage ? +process.env.PAGINATION_LIMIT! : perPage
        let offset = (page - 1) * perPage;
        let lang = request.headers.language



        let where = {[Op.and]:<WhereOptions[]>[]}

        where[Op.and].push({isParent:true})

        if(inStock){
            where[Op.and].push({inStock:inStock}) 
        }
    

        if(searchText){
         
                where[Op.and].push(sequelize.literal("name like '%"+searchText+"%'"));
      
        }
        const record = await Models.GroceryItems.findAndCountAll(   
            {
                include:[{
                    model:Models.GroceryItems,
                    as:"variants"

                }],  
                offset: offset,
                limit: perPage,
                distinct: true,
                order: [['createdAt','DESC']],
                where:where
             }
            );

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

export const listAllGroceryItems = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try {
        let { searchText,inStock,status} = request.query

        let where = {[Op.and]:<WhereOptions[]>[]}
        where[Op.and].push({isParent:true})
        if(inStock){
            where[Op.and].push({inStock:inStock})   
        }
        if(searchText){
            where[Op.and].push(sequelize.literal("name like '%"+searchText+"%'"));
        }
        const record = await Models.GroceryItems.findAll(   
            {
                include:[{
                    model:Models.GroceryItems,
                    as:"variants"

                }],
                order: [['createdAt','DESC']],
                where:where
             }
            );
        if (!record) {
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }
        return h.response({ message: 'Record  successfully', responseData: JSON.parse(JSON.stringify(record))}).code(200);
    } catch (error) {
        console.log(error);
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
}

export const createGroceryItem = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
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
        let {name,coverImage,description,overview,inStock,quantity,price,isParent,parentId,variants} = request.payload;
        
        let data = {
            name: name,
            coverImage: coverImage,
            description: description,
            overview: overview,
            leftQuantity: quantity,
            inStock:  quantity > 0 ? true : false,
            price: price,
            isParent: isParent,
            parentId:parentId
        }

        let dataToInsert = await removeUndefinedFields(data)
        let createItem = await Models.GroceryItems.create(dataToInsert,{transaction})
        if(!createItem){
            await transaction.rollback();
            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
        }
        
        if(variants && variants.length){
            for(let variant of variants){
                variant["leftQuantity"] = variant.quantity
                variant["parentId"] = createItem.id
                variant["isParent"] = false
                variant = await removeUndefinedFields(variant)
            }

            let variantBulkCreate = await Models.GroceryItems.bulkCreate(variants,{transaction})
        }
        await transaction.commit();

        let fetchCreatedRecord = await fetch(createItem.id!)
        return h.response({
            message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst('GROCERY_ITEMS_CREATED_SUCCESSFULLY')),
            responseDate: JSON.parse(JSON.stringify(fetchCreatedRecord))
        }).code(200);

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};

export const updateGroceryItem = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        console.log(request.auth)
        const userId = request.auth.credentials.userData.id;
        // const accountId = request.auth.credentials.userData.accountId;
        const languageCode = request.headers.language;
        let { id,name,coverImage,description,overview,inStock,quantity,price,isParent,parentId,variants } = request.payload;
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


        let existingRecord = await Models.GroceryItems.findOne({where:{id:id}})
        if(!existingRecord){
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID_RECORD_NOT_FOUND', {});
        }

        existingRecord = JSON.parse(JSON.stringify(existingRecord))
        if(existingRecord?.isParent){
            if(variants && variants.length){
            

                let existingVariants = variants.filter((variant:GroceryItems) => variant.id); // For update
                let newVariants = variants.filter((variant:GroceryItems) => !variant.id); // For creation
                
                if(existingVariants.length){
                    for(let i = 0; i < existingVariants.length; i++){
                        let updateData = await removeUndefinedFields(existingVariants[i])
                        let updateRecord = await Models.GroceryItems.update(updateData,{where:{id: updateData.id}})

                    }
                }

               
                for(let variant of newVariants){
                    variant["parentId"] = id
                    variant["isParent"] = false
                    variant = await removeUndefinedFields(variant)
                }
    
                let variantBulkCreate = await Models.GroceryItems.bulkCreate(newVariants,{transaction})
            }
        }
         
        let data = {
            name: name,
            coverImage: coverImage,
            description: description,
            overview: overview,
            leftQuantity: quantity,
            inStock:  quantity > 0 ? true : false,
            price: price,
            isParent: isParent,
            parentId:parentId
        }
        let dataToBeUpdate = await removeUndefinedFields(data)

        let updateRecord = await Models.GroceryItems.update(dataToBeUpdate,{where:{id:id},transaction})
        await transaction.commit();
        let updatedRecord = await fetch(id)
        return h.response({
            message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst('GROCERY_ITEMS_UPDATED_SUCCESSFULLY')),
            responseData: JSON.parse(JSON.stringify(updatedRecord)),
        }).code(200);

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};

export const updateStatus = async(request: Hapi.RequestQuery, h:Hapi.ResponseToolkit) => {
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
        let { id,status } = request.query;
        // Check if the grocery exists
        let existRecord = await Models.GroceryItems.findOne({where:{id:id}})
        if(!existRecord){
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID_RECORD_NOT_FOUND', {});
        }
        // Proceed to update if record is found
        let updateRecord = await Models.GroceryItems.update(
            { status: status },
            { where: { id: id }, transaction: transaction }
        );

        if (updateRecord) {  // check if rows were affected
            await transaction.commit();
            let updatedRecord = await fetch(id)
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_SUCCESSFULL")), responseData: updatedRecord }).code(200);
        } else {
            await transaction.rollback();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_UNSUCCESSFULL")) }).code(400);
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

        let existRecord = await Models.GroceryItems.findOne({where:{id:id}})
        if(!existRecord){
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_ID_RECORD_NOT_FOUND', {});
        }

        existRecord = JSON.parse(JSON.stringify(existRecord))
        
        // deleting all the variants if its a parent item
        if(existRecord?.isParent){
            if(existRecord?.haveVariant){
                await Models.GroceryItems.destroy({where:{parentId:id},transaction})
            }
        }

        await Models.GroceryItems.destroy({where:{id:id},transaction})



        await transaction.commit();
        return h.response({ message: 'Record deleted successfully' }).code(200);

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', error);
    }
};


