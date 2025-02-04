// // Include Required Packages
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
import { WhereOptions } from "sequelize";
import * as Hapi from "@hapi/hapi";
import Moment from "moment-timezone";

import { Literal } from "sequelize/types/utils";
type AttributeElement = string | [Literal, string];

// Define all query attributes

const attributes: AttributeElement[] = [
    'id','code','status','isRevision','revisionId','createdAt','updatedAt','isDefault',
    [sequelize.literal('(case when `content`.name is not null then `content`.name else `defaultContent`.name END)'), 'name']
]

const rolePermissions: AttributeElement[] = [
    'id',
    [sequelize.literal('(case when `Permissions->content`.name is not null then `Permissions->content`.name else `Permissions->defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `Permissions->content`.description is not null then `Permissions->content`.description else `Permissions->defaultContent`.description END)'), 'description']
]

const authorAttributes: AttributeElement[] = [
    'id',
    [sequelize.literal('`author->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`author->UserProfile->profileImage`.`unique_name`'), 'profileImage']
];

const updatedByAttributes: AttributeElement[] = [
    'id',
    [sequelize.literal('`updatedBy->UserProfile`.`name`'), 'name'],
    [sequelize.literal('`updatedBy->UserProfile->profileImage`.`unique_name`'), 'profileImage']
];

// Fetch a role by role identifier

const fetch=async(roleId: number,accountId: number,language: string)=>{
    try{
        let role = await Models.Role.findOne({
            attributes:attributes,
            where:{id:roleId},
            subQuery:false,
            include:[
                {
                    model:Models.RoleContent,
                    attributes:[],
                    as:'content',
                    include:[
                        {attributes:[],model:Models.Language, where:{code:language}}
                    ]
                },
                {
                    model:Models.RoleContent,
                    attributes:[],
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
                            //as:"userProfile",
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
                            //as:"userProfile",
                            attributes:[],
                            include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                        }
                    ]
                },
                {
                    model:Models.Permission,
                    attributes:rolePermissions,
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
                        }
                    ],
                    through: {
                        attributes: []
                    }
                }
            ]
        });
        if(role){
            return role;
        }
        return false;
    }catch(err){
        console.log(err)
        return false;
    }
}

// Generate revision of role for prior to update and delete functions.

const storeRevision=async(Object: any,transaction:any)=>{
    try{
        let revisonObject=JSON.parse(JSON.stringify(Object));
        let revisionId=revisonObject.id;
        revisonObject = _.omit(revisonObject,['id']);
        revisonObject.isRevision=true;
        revisonObject.code=revisonObject.code+'-'+Moment().toISOString();
        revisonObject.revisionId=revisionId;
        for(const key in revisonObject.RoleContents){
            revisonObject.RoleContents[key] = _.omit(revisonObject.RoleContents[key],['id','roleId'])
        }
        let Permissions=[];
        for(let permission of revisonObject.Permissions){
            Permissions.push(permission.id)
        }
        revisonObject = _.omit(revisonObject,['Permissions'])
        let revision = await Models.Role.create(revisonObject,{include:[{model:Models.RoleContent}],transaction:transaction});
       
        let revisionPermissions = await revision.setPermissions(Permissions,{transaction:transaction});
        if(revision && revisionPermissions)
            return revision;
        else 
            return false;
    }catch(err){
        return false;
    }
}

// Create New role with permissions
exports.create = async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let accountId = request.auth.credentials.userData.accountId;
        let userId = request.auth.credentials.userData.id;
        let {name,permissions}=request.payload;
        permissions = [...new Set(permissions)];
        let verifyPermissions = await Models.Permission.count({where:{id:{[Op.in]:permissions}}});
        if(verifyPermissions!=permissions.length){
            await transaction.rollback();
            return Common.generateError(request,400,'INVALID_PERMISSION_ASSOCIATION_DETECTED',{});
        }
        let code = await Common.slugify(name);

        console.log({code})

        let roleVerification = await Models.Role.findOne({where:{code:code}});
        if(roleVerification) {
            await transaction.rollback();
            return Common.generateError(request,400,'ROLE_NAME_ALREADY_IN_USE',{});
        }

        let roleContent=[];
        let defaultLanguage=await Models.Language.findOne({where:{'code':process.env.DEFAULT_LANGUAGE_CODE}});
        let language = request.headers.language;
        let defaultLanguageObject:any = {}
        let requestedLanguageObject:any = {}



            if(language!=process.env.DEFAULT_LANGUAGE_CODE){
                // create content in default language as user language is not default
                let requestedLanguage=await Models.Language.findOne({where:{'code':request.headers.language}});
                if(defaultLanguage && requestedLanguage){
                    //create role in default in requested language
                    defaultLanguageObject={
                        name:name,
                        languageId:defaultLanguage.id
                    };
                    requestedLanguageObject={
                        name:name,
                        languageId:requestedLanguage.id
                    }
                    roleContent.push(defaultLanguageObject,requestedLanguageObject)
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'ERROR_WHILE_FETCHING_REQUIRED_LANGUAGE_FOR_CONTENT_CREATION',{});
                }
            }else{
                defaultLanguageObject={
                    name:name,
                    languageId:defaultLanguage!.id
                }
                roleContent.push(defaultLanguageObject) 
            }

            console.log({roleContent})

            let newRole = await Models.Role.create({
                code:code,
                userId:userId,
                accountId:accountId,
                status:Constants.STATUS.ACTIVE, 
                RoleContents:roleContent, 
                isDefault: false
            },{transaction:transaction,include:[{model:Models.RoleContent}]});
            if(newRole){
                let rolePermissions = await newRole.setPermissions(permissions,{transaction:transaction});
                if(rolePermissions){
                    await transaction.commit();
                    let Role = await fetch(newRole.id!,accountId,request.headers.language);
                    if(Role){
                        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("ROLE_CREATED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(Role))}).code(200)
                    }else{
                        return Common.generateError(request,400,'ROLE_CREATED_SUCCESSFULLY_ERROR_WHILE_RETRIVING_IT_BACK',{});
                    }
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'ERROR_WHILE_ADDING_PERMISSIONS_TO_THE_ROLE',{});
                }
            }else{
                await transaction.rollback();
                return Common.generateError(request,400,'ERROR_WHILE_CREATING_ROLE',{});
            }
       
    }catch(err){
        console.log(err);
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// get a Role by id
exports.get=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let {id}=request.params
        let accountId = request.auth.credentials.userData.accountId;
        console.log("accountId------------>",accountId)
        let role = await fetch(id,accountId,request.headers.language);
        if(role){
            return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(role))}).code(200)
        }else{
            return Common.generateError(request,400,'ROLE_DOES_NOT_EXISTS',{});
        }
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// Update Role and permissions
exports.update=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let accountId = request.auth.credentials.userData.accountId;
        let userId = request.auth.credentials.userData.id;
        let {id}=request.params;
        let {name,permissions}=request.payload;
        let verifyPermissions = await Models.Permission.count({where:{id:{[Op.in]:permissions},accountId:accountId}});
        console.log("{userData}------------->",request.auth.credentials.userData)
        console.log("{accountId}------------->",accountId)
        console.log("{permissions length}------------->",permissions.length)
        console.log("{verifyPermissions}----------->",verifyPermissions)
        if(verifyPermissions!=permissions.length){
            await transaction.rollback();
            return Common.generateError(request,400,'INVALID_PERMISSION_ASSOCIATION_DETECTED',{});
        }
        let code = await Common.slugify(name);
        let role = await Models.Role.findOne({where:{id:id,accountId:accountId},include:[{model:Models.RoleContent},{model:Models.Permission}]});
        if(role){
            let revisonObject = JSON.parse(JSON.stringify(role))
            let revision = await storeRevision(revisonObject,transaction);
            if(revision){
                await Models.Role.update({lastUpdatedBy:userId,code:code},{where:{id:role.id},transaction:transaction});
                let requestedLanguageId = await Models.Language.findOne({where:{code:request.headers.language}})
                const existingContent = role.RoleContents!.find((content:any) => content.languageId == requestedLanguageId!.id);
                if(existingContent){
                    let updatedContent:any={};
                    updatedContent['name']=name;
                    await Models.RoleContent.update(updatedContent,{where:{id:existingContent.id},transaction:transaction});
                }else{
                    let newContent:any={};
                    newContent.name=name;
                    newContent.roleId=role.id;
                    newContent.languageId=requestedLanguageId!.id;
                    await Models.RoleContent.create(newContent,{transaction:transaction});
                }
                let rolePermissions = await role.setPermissions(permissions,{transaction:transaction});
                if(rolePermissions){
                    await transaction.commit()
                    let returnObject=await fetch(role.id!,accountId,request.headers.language);
                    returnObject = JSON.parse(JSON.stringify(returnObject));
                    return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("ROLE_UPDATED_SUCCESSFULLY")),responseData:returnObject}).code(200);
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'ERROR_WHILE_UPDATING_THE_REVISION',{});
                }
            }else{
                await transaction.rollback();
                return Common.generateError(request,400,'ERROR_WHILE_UPDATING_THE_REVISION',{});
            }
        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'ROLE_NOT_FOUND',{});
        }
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// delete a role
exports.delete=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    try{
        let {id}=request.params
        let accountId = request.auth.credentials.userData.accountId;
        let role = await fetch(id,accountId,request.headers.language);
        if(role){
            let userId = request.auth.credentials.userData.id;
            let revisonObject = JSON.parse(JSON.stringify(role))
            let revision = await storeRevision(revisonObject,transaction);
            if(revision){
                await Models.Role.update({lastUpdatedBy:userId},{where:{id:role.id},transaction:transaction});
                let removeRole = await Models.Role.destroy({where:{id:role.id},transaction:transaction});
                if(removeRole){
                    await transaction.commit();
                    return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("ROLE_DELETED_SUCCESSFULLY")),responseData:JSON.parse(JSON.stringify(role))}).code(200);
                }else{
                    await transaction.rollback();
                    return Common.generateError(request,400,'ROLE_ALREADY_REMOVED',{});
                }
            }else{
                await transaction.rollback();
                return Common.generateError(request,400,'UNABLE_TO_CREATE_REVISION',{});
            }
        }else{
            await transaction.rollback();
            return Common.generateError(request,400,'ROLE_DOES_NOT_EXISTS',{});
        }
    }catch(err){
        await transaction.rollback();
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

// list all roles with pagination
exports.list=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        let {searchText,page,perPage}=request.query;
        let language = request.headers.language;

        perPage = +process.env.PAGINATION_LIMIT! < perPage ? +process.env.PAGINATION_LIMIT! : perPage
        let offset = (page - 1) * perPage;

        let where = {[Op.and]:<WhereOptions[]>[]}

        where[Op.and].push({ isRevision: false });
       
        if (searchText) {
            where[Op.and].push({
                [Op.or]: [
                    { '$content.name$': { [Op.like]: `%${searchText}%` } },  
                    { '$defaultContent.name$': { [Op.like]: `%${searchText}%` } } 
                ]
            });
        }

        console.log(language, 'language')
        let roles = await Models.Role.findAndCountAll({
            attributes:attributes,
            where: where,
            distinct: true, 
            // col: "id",
            limit: perPage,
            offset: offset,
            order: [['id', 'desc']],
            include:[
                {
                    subQuery:true,
                    attributes:[],
                    model:Models.RoleContent,
                    as:'content',
                    include:[
                        {
                            subQuery:true,
                            attributes:[],
                            model:Models.Language,
                            where:{code:language}
                        }
                    ]
                },
                {
                    subQuery:true,
                    attributes:[],
                    model:Models.RoleContent,
                    as:'defaultContent',
                    include:[
                        {
                            subQuery:true,
                            attributes:[],
                            model:Models.Language,
                            where:{
                                code:process.env.DEFAULT_LANGUAGE_CODE
                            }
                        }
                    ]
                },
                // {
                //     attributes:authorAttributes,
                //     model:Models.User,
                //     as:'author',
                //     include:[
                //         {
                //             model:Models.UserProfile,
                //             //as: "userProfile",
                //             attributes:[],
                //             include:[
                //                 {
                //                     model:Models.Attachment,as:'profileImage',
                //                     attributes:[]
                //                 }
                //             ]
                //         }
                //     ]
                // },
                // {
                //     attributes:updatedByAttributes,
                //     model:Models.User,
                //     as:'updatedBy',
                //     include:[
                //         {
                //             model:Models.UserProfile,
                //             //as: "userProfile",
                //             attributes:[],
                //             include:[{model:Models.Attachment,as:'profileImage',attributes:[]}]
                //         }
                //     ]
                // },
                {
                    attributes:rolePermissions,
                    model:Models.Permission,
                    include:[
                        {
                            attributes:[], 
                            model:Models.PermissionContent,
                            as:'content',
                            include:[
                                {
                                    attributes:[],
                                    model:Models.Language,
                                    where:{code:language}
                                }
                            ]
                        },
                        {
                            attributes:[], 
                            model:Models.PermissionContent,
                            as:'defaultContent',
                            include:[
                                {
                                    attributes:[],
                                    model:Models.Language, 
                                    where:{code:process.env.DEFAULT_LANGUAGE_CODE}
                                }
                            ]
                        }
                    ],
                    through: {
                        attributes: []
                    }
                }
            ],
            // through: {
            //     attributes: []
            // }

        })
        let totalPages = await Common.getTotalPages(
            roles.count,
            perPage
        );
        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:{
            data:JSON.parse(JSON.stringify(roles.rows)),
            page:page,
            totalRecords:roles.count,
            totalPages:totalPages,
            perPage:perPage
        }}).code(200);

    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}


// list all roles without pagination

exports.listAll=async(request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    try{
        // let userId = request.auth.credentials.userData.id;
        // let accountId = request.auth.credentials.userData.accountId;
        // let {searchText}=request.query;
        let language = request.headers.language;
        console.log(language, 'languageeeeee')
        let roles = await Models.Role.findAll({
            attributes:attributes,
            where: { isRevision: false },
            include:[
                {
                    attributes:[],
                    model:Models.RoleContent,
                    as:'content',
                    include:[
                        {
                            attributes:[],
                            model:Models.Language,
                            where:{code:language}
                        }
                    ]
                },
                {
                    attributes:[],
                    model:Models.RoleContent,
                    as:'defaultContent',
                    include:[
                        {
                            attributes:[],
                            model:Models.Language,
                            where:{
                                code:process.env.DEFAULT_LANGUAGE_CODE
                            }
                        }
                    ]
                },
                {
                    attributes:authorAttributes,
                    model:Models.User,
                    as:'author',
                    include:[
                        {
                            model:Models.UserProfile,
                            //as: "userProfile",
                            attributes:[],
                            include:[
                                {
                                    model:Models.Attachment,as:'profileImage',
                                    attributes:[]
                                }
                            ]
                        }
                    ]
                },
                {
                    attributes:updatedByAttributes,
                    model:Models.User,
                    as:'updatedBy',
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
                    attributes:rolePermissions,
                    model:Models.Permission,
                    include:[
                        {
                            attributes:[], 
                            model:Models.PermissionContent,
                            as:'content',
                            include:[
                                {
                                    attributes:[],
                                    model:Models.Language,
                                    where:{code:language}
                                }
                            ]
                        },
                        {
                            attributes:[], 
                            model:Models.PermissionContent,
                            as:'defaultContent',
                            include:[
                                {
                                    attributes:[],
                                    model:Models.Language, 
                                    where:{code:process.env.DEFAULT_LANGUAGE_CODE}
                                }
                            ]
                        }
                    ],
                    through: {
                        attributes: []
                    }
                }
            ],
            // through: {
            //     attributes: []
            // }

        })
 
        return h.response({message:request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")),responseData:{data:JSON.parse(JSON.stringify(roles))}}).code(200);

    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}