import { id } from "aws-sdk/clients/datapipeline";
import * as Hapi from "@hapi/hapi";
import  {Models, sequelize} from "../models";
import * as Common from './common';
import * as Constants from '../constants';
const Moment = require("moment");
const _ = require("lodash");
import { Sequelize, Op } from "../config/dbImporter";
import { Json, Literal } from "sequelize/types/utils";
import { request } from "http";
import {hapi} from "hapi-i18n"
import { CategoryInterface,CategoryTypeContentInterface } from "../config/interfaces";
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";

type AttributeElement = string | [string | Literal, string];
// Define all query attributes
const attributes:AttributeElement[]=[
    'id','code','status','userId','isRevision','revisionId','createdAt','updatedAt',
    [sequelize.literal('(case when `content`.name is not null then `content`.name else `defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `content`.description is not null then `content`.description else `defaultContent`.description END)'), 'description']
];

const authorAttributes:AttributeElement[]=[
    'id',
    [sequelize.literal('`author->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`author->UserProfile->profileImage`.`unique_name`'), 'profileImage']
]

const updatedByAttributes:AttributeElement[]=[
    'id',
    [sequelize.literal('`updatedBy->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`updatedBy->UserProfile->profileImage`.`unique_name`'), 'profileImage']
]

// Fetch a category type by identifier
const fetch=async(id: id,language: any)=>{
    
    let categoryType= await Models.CategoryType.findOne({
        attributes:attributes,
        include:[
            {
                attributes:[],
                model:Models.CategoryTypeContent,as:'content',
                include:[
                    {attributes:[],model:Models.Language, where:{code:language}}
                ]
            },
            {
                attributes:[],
                model:Models.CategoryTypeContent,as:'defaultContent',
                include:[
                    {attributes:[],model:Models.Language, where:{code:process.env.DEFAULT_LANGUAGE_CODE}}
                ]
            },
            {
                model:Models.User,
                as:'updatedBy',
                attributes:updatedByAttributes,
                include:[
                    {
                        model:Models.UserProfile,
                        attributes:[],
                        include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                    }
                ]
            },
            {
                model:Models.User,
                as:'author',
                attributes:authorAttributes,
                include:[
                    {
                        model:Models.UserProfile,
                        attributes:[],
                        include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                    }
                ]
            }
        ],
        where:{id:id},
        subQuery:false,

    });

    console.log(JSON.parse(JSON.stringify(categoryType)))
    return categoryType;
}

// Generate revision of category type prior to update and delete functions.
const storeRevision=async(Object:CategoryInterface,transaction: Sequelize.Transaction)=>{
    try{
        let revisonObject=JSON.parse(JSON.stringify(Object));
        let revisionId=revisonObject.id;
        revisonObject = _.omit(revisonObject,['id']);
        revisonObject.isRevision=true;
        revisonObject.code=revisonObject.code+'-'+Moment().toISOString();
        revisonObject.revisionId=revisionId;
        for(const key in revisonObject.CategorytypeContents){
            revisonObject.CategorytypeContents[key] = _.omit(revisonObject.CategorytypeContents[key],['id','categorytypeId'])
        }
        let revision = await Models.CategoryType.create(revisonObject,{include:[{model:Models.CategoryTypeContent}],transaction:transaction});
        if(revision)
            return revision;
        else 
            return false;
    }catch(err){
        return false;
    }
}

// create a new category type
export const create=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {name,description}=request.payload;
        let exists = await Models.CategoryType.findOne({
            include:[
                {model:Models.CategoryTypeContent,where:{name:name}}
            ]
        });
        if(!exists){
            let userId = request.auth.credentials.userData.id;
            let slug = await Common.slugify(name);
            let language = request.headers.language;
            let descriptionText = await Common.convertHtmlToText(description)
            let defaultLanguageObject={} as CategoryTypeContentInterface;
            let requestedLanguageObject={}as CategoryTypeContentInterface;
            let defaultLanguage=await Models.Language.findOne({where:{'code':process.env.DEFAULT_LANGUAGE_CODE}});
            let CategorytypeContents:CategoryTypeContentInterface[]=[];
            if(defaultLanguage){
                    if(language!=process.env.DEFAULT_LANGUAGE_CODE){
                        // create content in default language as user language is not default
                        let requestedLanguage=await Models.Language.findOne({where:{'code':request.headers.language}});
                        if(defaultLanguage && requestedLanguage){
                            //create categoryType in default in requested language
                            defaultLanguageObject={
                                name:name,
                                description:description,
                                descriptionText:descriptionText,
                                languageId:defaultLanguage.id
                            };
                            requestedLanguageObject={
                                name:name,
                                description:description,
                                descriptionText:descriptionText,
                                languageId:requestedLanguage.id
                            }
                            CategorytypeContents.push(defaultLanguageObject,requestedLanguageObject)
                        }else{
                            await transaction.rollback()
                            return Common.generateError(request,400,'ERROR_WHILE_FETCHING_REQUIRED_LANGUAGE_FOR_CONTENT_CREATION',{});
                        }
                    }else{
                        defaultLanguageObject={
                            name:name,
                            description:description,
                            descriptionText:descriptionText,
                            languageId:defaultLanguage?.id
                        }
                        CategorytypeContents.push(defaultLanguageObject) 
                    }
                    let categoryType = await Models.CategoryType.create(
                        {
                            code:slug,
                            userId:userId,
                            lastUpdatedBy:null,
                            status:Constants.STATUS.ACTIVE,
                            CategorytypeContents:CategorytypeContents,
                          
                        },
                        {
                            include:[
                                {model:Models.CategoryTypeContent}
                            ],
                            transaction:transaction
                        }
                    );
                    if(categoryType){
                        if(CategorytypeContents){
                        let data = await Models.CategoryTypeContent.create({...CategorytypeContents[0],categorytypeId:categoryType.id},{transaction})
                        console.log(data)
                        }
                        
                        
                        let returnOBj = JSON.parse(JSON.stringify(categoryType));
                        console.log("---",CategorytypeContents)
                        returnOBj['name']=CategorytypeContents[0].name;
                        returnOBj['description']=CategorytypeContents[0].description;
                        returnOBj = _.omit(returnOBj, ['CategorytypeContents']);
                        console.log(returnOBj)
                        await transaction.commit();
                        let returnObject = await fetch(returnOBj.id,request.headers.language);
                        returnObject = JSON.parse(JSON.stringify(returnObject));
                        console.log("hello-----",returnOBj)
                        
                        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("CATEGORY_TYPE_HAS_BEEN_CREATED_SUCCESSFULLY")),responseData:returnOBj}).code(200)
                    }else{
                        await transaction.rollback();
                        return Common.generateError(request,400,'ERROR_WHILE_CREATING_THE_CATEGORY_TYPE',{});
                    }
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'CONTENT_TYPE_ALREADY_EXISTS_WITH_SAME_NAME',{});
                }
        }
        else{
            await transaction.rollback();
            return Common.generateError(request, 400, 'DEFAULT_LANGUAGE_NOT_FOUND', {});
        }
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// get a category type by id
export const  get=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let {id}=request.params
        let categorytype = await fetch(id,request.headers.language);
        if(categorytype){
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(categorytype))}).code(200)
        }else{
            return Common.generateError(request,400,'CATEGORY_TYPE_DOES_NOT_EXISTS',{});
        }
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// update a category type
export const  update=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {id}=request.params;
        let userId = request.auth.credentials.userData.id;
        let {name,description}=request.payload;
        let categorytype = await Models.CategoryType.findOne({
            where:{id:id,isRevision:false,revisionId:null!},
            include:[
                {   
                    model:Models.CategoryTypeContent
                }
            ]
        });
        if(categorytype){
            // Create revision of existing entity in DB
            let revisonObject = JSON.parse(JSON.stringify(categorytype))
            let revision = await storeRevision(revisonObject,transaction);
            let updateStamp = await Models.CategoryType.update({lastUpdatedBy:userId},{where:{id:categorytype.id},transaction:transaction});
            let requestedLanguageId = await Models.Language.findOne({where:{code:request.headers.language}})
            // const existingContent = categorytype?.CategorytypeContents?.find((content) => content.languageId == requestedLanguageId?.id);
            const existingContent = await Models.CategoryTypeContent.findOne({where:{categorytypeId: id}})
            if(existingContent){
                let updatedContent:CategoryTypeContentInterface = {name:'', description:'',descriptionText:'',languageId:existingContent!.languageId};
                updatedContent['name']=name;
                updatedContent['description']=description;
                updatedContent['descriptionText']=await Common.convertHtmlToText(description)
                await Models.CategoryTypeContent.update(updatedContent,{where:{id:existingContent.id},transaction:transaction});
            }else{
                let newContent:CategoryTypeContentInterface = {name:'', description:'',descriptionText:'',languageId:existingContent!.languageId};
                newContent.name=name;
                newContent.description=description;
                newContent.categorytypeId=categorytype.id;
                newContent.descriptionText=await Common.convertHtmlToText(description);
                newContent.languageId=requestedLanguageId!.id;
                await Models.CategoryTypeContent.create(newContent,{transaction:transaction});
            }
            await transaction.commit();
            let responseObject = await fetch(id,request.headers.language);
            responseObject = JSON.parse(JSON.stringify(responseObject));
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("CATEGORY_TYPE_HAS_BEEN_UPDATED_SUCCESSFULLY")),responseData:responseObject}).code(200)

        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'CATEGORY_TYPE_ID_NOT_FOUND',{});
        }
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }

}

// Delete a category type by identifier
export const  deleteCategoryType =async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {id}=request.params;
        let categorytype = await fetch(id,request.headers.language);
        if(categorytype){
            if(categorytype.userId){
                let userId = request.auth.credentials.userData.id;
                let revisonObject = JSON.parse(JSON.stringify(categorytype))
                let revision = await storeRevision(revisonObject,transaction);
                if(revision){
                    let updateStamp = await Models.CategoryType.update({lastUpdatedBy:userId},{where:{id:categorytype.id},transaction:transaction});
                    let removeCategory = await categorytype.destroy({transaction:transaction});
                    await transaction.commit();
                    return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("CATEGORY_TYPE_HAS_BEEN_DELETED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(categorytype))}).code(200);
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'ERROR_WHILE_UPDATING_THE_REVISION',{});
                }
            }else{
                await transaction.rollback();
                return Common.generateError(request,400,'DEFAULT_CATEGORY_TYPES_CANNOT_BE_DELETED',{});
            }
        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'CATEGORY_TYPE_ID_NOT_FOUND',{});
        }

    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// Get all active category types
export const  getAll=async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let where = {}
        where = {isRevision:false}
        console.log(request)
        if(request.query && typeof request.query.status !== 'undefined'){
            where = {...where,status:request.query.status}
        }
        let categorytypes = await Models.CategoryType.findAll({
            attributes:attributes,
            where:where,
            include:[
                {
                    attributes:[],
                    model:Models.CategoryTypeContent,as:'content',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:request.headers.language}}
                    ]
                },
                {
                    attributes:[],
                    model:Models.CategoryTypeContent,as:'defaultContent',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:process.env.DEFAULT_LANGUAGE_CODE}}
                    ]
                },
                {
                    model:Models.User,
                    as:'updatedBy',
                    attributes:updatedByAttributes,
                    include:[
                        {
                            model:Models.UserProfile,
                            attributes:[],
                            include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                        }
                    ]
                },
                {
                    model:Models.User,
                    as:'author',
                    attributes:authorAttributes,
                    include:[
                        {
                            model:Models.UserProfile,
                            attributes:[],
                            include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                        }
                    ]
                }
            ]
        })
        console.log(JSON.parse(JSON.stringify(categorytypes)))
        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(categorytypes))}).code(200)
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// List category types with pagination 
export const  list=async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let {perPage,page} = request.query;
        perPage = +process.env.PAGINATION_LIMIT!<perPage?+process.env.PAGINATION_LIMIT!:perPage
        let offset = (page - 1) * perPage;
        let categorytypes = await Models.CategoryType.findAndCountAll({
            attributes:attributes,
            include:[
                {
                    attributes:[],
                    model:Models.CategoryTypeContent,as:'content',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:request.headers.language}}
                    ]
                },
                {
                    attributes:[],
                    model:Models.CategoryTypeContent,as:'defaultContent',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:process.env.DEFAULT_LANGUAGE_CODE}}
                    ]
                },
                {
                    model:Models.User,
                    as:'updatedBy',
                    attributes:updatedByAttributes,
                    include:[
                        {
                            model:Models.UserProfile,
                            attributes:[],
                            include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                        }
                    ]
                },
                {
                    model:Models.User,
                    as:'author',
                    attributes:authorAttributes,
                    include:[
                        {
                            model:Models.UserProfile,
                            attributes:[],
                            include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                        }
                    ]
                }
                
            ],
            order:[['id','desc']],
            where:{isRevision:false},
            offset:offset,
            limit: perPage,
            distinct:true,
            subQuery:false

        });
        const count = categorytypes.count;
        let totalPages = await Common.getTotalPages(count,perPage);
        let rows = JSON.parse(JSON.stringify(categorytypes.rows));
        return h.response({
            message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("CATEGORY_TYPE_LIST_REQUEST_PROCESSED_SUCCESSFULLY")),
            responseData:{
                data:rows,
                perPage:perPage,
                page:page,
                totalPages:totalPages
            }
        }).code(200)
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// update status of category type
export const  updateStatus=async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {id}=request.params;
        let userId = request.auth.credentials.userData.id;
        let {status}=request.payload;
        let categorytype = await Models.CategoryType.findOne({
            where:{id:id,isRevision:false,revisionId:null as unknown as number},
            include:[
                {
                    model:Models.CategoryTypeContent
                }
            ]
        }); 
        if(categorytype){
            // Create revision of existing entity in DB
            let revisonObject = JSON.parse(JSON.stringify(categorytype))
            let revision = await storeRevision(revisonObject,transaction);
            let updateStamp = await Models.CategoryType.update({lastUpdatedBy:userId,status:status},{where:{id:categorytype.id},transaction:transaction});
            await transaction.commit();
            let responseObject = await fetch(id,request.headers.language);
            responseObject = JSON.parse(JSON.stringify(responseObject));
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("CATEGORY_TYPE_HAS_BEEN_UPDATED_SUCCESSFULLY")),responseData:responseObject}).code(200)

        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'CATEGORY_TYPE_ID_NOT_FOUND',{});
        }

    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}