// const Models = require("../models");
// const Common = require("./common");
// const Constants = require("../constants");
// const Moment = require("moment");
// const _ = require("lodash");
// const {Sequelize,Op}=require("../config/dbImporter")
// import * as Hapi from "@hapi/hapi";

import {Models,sequelize} from "../models";
import * as Common from "./common";
import * as Constants from "../constants";
import _ from "lodash";
import { Sequelize, Op } from "../config/dbImporter";
import * as Hapi from "@hapi/hapi";
import Moment from "moment-timezone";

import { Literal } from "sequelize/types/utils";
type AttributeElement = string | [Literal, string];

const categoryPermissionAttributes:AttributeElement[] = [
    'id','code','status','userId','isRevision','revisionId','createdAt','updatedAt',
    [sequelize.literal('(case when `content`.name is not null then `content`.name else `defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `defaultContent`.description is not null then `defaultContent`.description else `defaultContent`.description END)'), 'description']
];

const attributes:AttributeElement[] = [
    'id','code','status','userId','isRevision','revisionId','createdAt','updatedAt',
    [sequelize.literal('(case when `content`.name is not null then `content`.name else `defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `content`.description is not null then `content`.description else `defaultContent`.description END)'), 'description'],
];

const authorAttributes:AttributeElement[] = [
    'id',
    [sequelize.literal('`author->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`author->UserProfile->profileImage`.`unique_name`'), 'profileImage']
];

const updatedByAttributes:AttributeElement[] = [
    'id',
    [sequelize.literal('`updatedBy->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`updatedBy->UserProfile->profileImage`.`unique_name`'), 'profileImage']
];

const createrevision=async(Object:any)=>{
    try{
        let revisonObject=JSON.parse(JSON.stringify(Object));
        let revisionId=revisonObject.id;
        revisonObject = _.omit(revisonObject,['id']);
        revisonObject.isRevision=true;
        revisonObject.code=revisonObject.code+'-'+Moment().toISOString();
        revisonObject.revisionId=revisionId;
        for(const key in revisonObject.PermissionContents){
            revisonObject.PermissionContents[key] = _.omit(revisonObject.PermissionContents[key],['id','permissionId'])
        }
        let revision = await Models.Permission.create(revisonObject,{include:[{model:Models.PermissionContent}]});
        if(revision)
            return revision;
        else 
            return false;
    }catch(err){
        return false;
    }
}

const fetchPermission=async(id:number,accountId:number,language:string)=>{
    let permission= await Models.Permission.findOne({
        attributes:attributes,
        include:[
            {
                attributes:[],
                model:Models.PermissionContent,
                as:'content',
                include:[
                    {attributes:[],model:Models.Language, where:{code:language}}
                ]
            },
            {
                attributes:[],
                model:Models.PermissionContent,
                as:'defaultContent',
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
                        //as: "userProfile",
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
                        //as: "userProfile",
                        attributes:[],
                        include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                    }
                ]
            }
        ],
        where:{id:id,accountId:accountId},
        subQuery:false,
    });
    return permission;
}

// Register a new permission to system
exports.create=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {name,categoryId,description,code}=request.payload;
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        
        let existingPermission = await Models.Permission.findOne({where:{code:code}});
        if(existingPermission) {
            await transaction.rollback();
            return Common.generateError(request,400,'DUPLICATE_PERMISSION_RECORD',{});
        }

        let permissionContent=[];
        let defaultLanguage=await Models.Language.findOne({where:{'code':process.env.DEFAULT_LANGUAGE_CODE}});
        let language = request.headers.language;
        let defaultLanguageObject: any = {}
        let requestedLanguageObject: any = {}

        if(language!=process.env.DEFAULT_LANGUAGE_CODE){
            // create content in default language as user language is not default
            let requestedLanguage=await Models.Language.findOne({where:{'code':request.header.language}});
            if(!defaultLanguage || !requestedLanguage) {
                await transaction.rollback();
                return Common.generateError(request,400,'ERROR_WHILE_FETCHING_REQUIRED_LANGUAGE_FOR_CONTENT_CREATION',{});
            }
            //create category in default in requested language
            defaultLanguageObject = { name:name, description:description, languageId:defaultLanguage.id };
            requestedLanguageObject={ name:name, description:description, languageId:requestedLanguage.id }
            permissionContent.push(defaultLanguageObject,requestedLanguageObject)
        }else{
            defaultLanguageObject={ name:name, description:description, languageId:defaultLanguage!.id }
            permissionContent.push(defaultLanguageObject) 
        }

        let permission = await Models.Permission.create(
            { code:code, userId:userId, accountId:accountId, PermissionContents:permissionContent},
            {include:[{model:Models.PermissionContent}]}
        );

        if(!permission) {
            await transaction.rollback();
            return Common.generateError(request,400,'ERROR_WHILE_CREATING_THE_PERMISSIONS',{});
        }

        await transaction.commit();
        let returnObject=await fetchPermission(permission.id!,accountId,request.headers.language);
        returnObject = JSON.parse(JSON.stringify(returnObject));
        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PERMISSION_CREATED_SUCCESSFULLY")),responseData:returnObject}).code(200);
 
    }catch(err){
        console.log(err, 'eeeeeeee')
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// get a Permission by id
exports.get=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let {id}=request.params
        let accountId = request.auth.credentials.userData.accountId;
        let permission = await fetchPermission(id,accountId,request.headers.language);
        if(permission){
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(permission))}).code(200)
        }else{
            return Common.generateError(request,400,'PERMISSION_DOES_NOT_EXISTS',{});
        }
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// Update permission to system
exports.update=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {name,categoryId,description,code}=request.payload;
        let {id}=request.params;
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;

        let Permission = await Models.Permission.findOne({where:{id:id},include:[{model:Models.PermissionContent}]});
        if(!Permission) {
            await transaction.rollback();
            return Common.generateError(request,400,'DUPLICATE_PERMISSION_RECORD',{});
        }

        let revisonObject = JSON.parse(JSON.stringify(Permission))
        let revision = await createrevision(revisonObject);
        if(!revision) {
            await transaction.rollback();
            return Common.generateError(request,400,'ERROR_WHILE_CREATING_REVISION',{});
        }

        let updateStamp = await Models.Permission.update({lastUpdatedBy:userId,code:code},{where:{id:Permission.id},transaction:transaction});
        
        let requestedLanguageId = await Models.Language.findOne({where:{code:request.headers.language}})
        const existingContent = Permission.PermissionContents!.find((content:any) => content.languageId == requestedLanguageId!.id);
        if(existingContent){
            let updatedContent:any={};
            updatedContent['name']=name;
            updatedContent['description']=description;
            await Models.PermissionContent.update(updatedContent,{where:{id:existingContent.id},transaction:transaction});
        }else{
            let newContent:any={};
            newContent.name=name;
            newContent.description=description;
            newContent.languageId=requestedLanguageId!.id;
            await Models.PermissionContent.create(newContent,{transaction:transaction});
        }
        await transaction.commit()
        let returnObject=await fetchPermission(Permission.id!,accountId,request.headers.language);
        returnObject = JSON.parse(JSON.stringify(returnObject));
        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PERMISSION_CREATED_SUCCESSFULLY")),responseData:returnObject}).code(200);
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// get a Permission by id
exports.delete=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {id}=request.params
        let accountId = request.auth.credentials.userData.accountId;
        let Permission = await fetchPermission(id,accountId,request.headers.language);
        if(Permission){
            let userId = request.auth.credentials.userData.id;
            let revisonObject = JSON.parse(JSON.stringify(Permission))
            let revision = await createrevision(revisonObject);
            if(revision){
                let updateStamp = await Models.Permission.update({lastUpdatedBy:userId},{where:{id:Permission.id}});
                let removePermission = await Permission.destroy({transaction:transaction});
                await transaction.commit();
                return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PERMISSION_DELETED_SUCCESSFULLY")),responseData: {}}).code(200);
            }
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(Permission))}).code(200)
        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'PERMISSION_DOES_NOT_EXISTS',{});
        }
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// fetch permissions according to access
exports.fetchPermisions=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        // let permissionCategorytype = await Models.Categorytype.findOne({where:{code:'permission'}});
        let defaultLanguage=await Models.Language.findOne({where:{'code':process.env.DEFAULT_LANGUAGE_CODE}});
        let language = request.headers.language;
        let permissions = await Models.Permission.findAll({
            attributes:categoryPermissionAttributes,
            include:[
                {
                    attributes:[],
                    model:Models.PermissionContent,as:'content',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:language}}
                    ]
                },
                {
                    attributes:[],
                    model:Models.PermissionContent,as:'defaultContent',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:process.env.DEFAULT_LANGUAGE_CODE}}
                    ]
                },
            ]
        })
        return h.response({permissions:permissions}).code(200)
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}