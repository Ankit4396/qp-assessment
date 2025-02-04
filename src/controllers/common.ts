import  Hapi from "@hapi/hapi";
import * as Boom from "@hapi/boom";
import {decode, JwtPayload} from "jsonwebtoken";
import * as crypto from "crypto-js";
import { boolean, object } from "joi";
import * as Joi from 'joi';
import { Models, sequelize } from '../models';
import Moment from "moment-timezone";
import * as handlebars from 'handlebars';
import * as convert from 'html-to-text'
import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';
import * as Fs from 'file-system';
import NodeCache from "node-cache";
import {Model} from "sequelize"
import { Sequelize, Op } from "../config/dbImporter";
import constants from "./constants";
import { ObjectKey } from "aws-sdk/clients/s3";
import { Key } from "node-cache";
import { Keys } from "aws-sdk/clients/costexplorer";
import * as csv from 'fast-csv';
const Jwt = require('jsonwebtoken');
const axios = require('axios'); 


let sessionCache = new NodeCache();
AWS.config.update({
    accessKeyId: process.env.SES_ACCESS_KEY,
    secretAccessKey: process.env.SES_ACCESS_SECRET,
    region: process.env.SES_REGION,
  });
  
const transporter = nodemailer.createTransport( {
    service: 'gmail',
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

interface GlobalHeaders {
    language: Joi.StringSchema;
    countrycode : Joi.StringSchema;
    timezone: Joi.StringSchema;
    connection: Joi.StringSchema;
    authorization?: Joi.StringSchema;
    devicetype: Joi.StringSchema;
    devicetoken: Joi.StringSchema;
  }
  interface subData {
    createdBy?: number,
    code?: string,
    isInclusion?:boolean,
    tripActivityId?:number,
    packageId?:number 
}

const convertHtmlToText = async (html: string): Promise<string> => {
    const text = convert.htmlToText(html, {});
    return text;
  };


  const encrypt = (text:string)=>{
    let encrypted =crypto.AES.encrypt(text, process.env.CRYPTO_KEY).toString();
    return encrypted;
}

export function convertUnderscoreToSpaceAndCapitalizeFirst(inputString: string): string {
    const formattedString: string = inputString.replace(/_/g, ' ')
                                               .toLowerCase();
    return formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
  }
const generateError=(request:Hapi.RequestQuery,type:number,message:string,err:any)=>{
    // return Boom.badRequest(message);
    let error:Boom.Boom<unknown>
    message = convertUnderscoreToSpaceAndCapitalizeFirst(message)
    console.log("message--",message)
    switch(type){
        case 500:
            error = Boom.badImplementation(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('INTERNAL_SERVER_ERROR'));
            error.output.payload.message =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst(message));
            error.output.payload.errors = err;
            console.log(err);
            break;
        case 400:
            error = Boom.badRequest(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('BAD_REQUEST'));
            error.output.payload.message = request.i18n.__(message);
            error.output.payload.errors = err;
            break;
        case 401:
            error = Boom.unauthorized(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('UNAUTHORIZED_REQUEST'));
            error.output.payload.message =  request.i18n.__(message);
            error.output.payload.errors = err;
            break;
        case 403:
            error = Boom.forbidden(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('PERMISSION_DENIED'));
            error.output.payload.message =  request.i18n.__(message);
            error.output.payload.errors = err;
            break;
        case 404:
            error = Boom.notFound(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('FILE_NOT_FOUND'));
            error.output.payload.message =  request.i18n.__(message);
            error.output.payload.errors = err;
            break;
        default: 
            error = Boom.badImplementation(message);
            error.output.payload.error =  request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('UNKNOWN_ERROR_MESSAGE'));
            error.output.payload.message =  request.i18n.__(message);
            error.output.payload.errors = err;
            break;
    }
    //console.log(error);
    return error;
}
const decrypt=(text:string)=>{
    try{
    let decrypted = crypto.AES.decrypt(text,process.env.CRYPTO_KEY).toString(crypto.enc.Utf8)
    return decrypted
    }catch(err){
        console.log(err);
        return false;
      }
}

// Generate slug for a text
const slugify = async (text:string,append='') =>{
    let slug = text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    if(append){
        slug=slug+'-'+append;
    }
    return slug;
}

interface tokenData {
    data:string;
    iat:number
}

const validateToken = async (token:tokenData,type:string | string[]) => {
    if(token){
        let fetchToken = JSON.parse(decrypt(token.data));
        let includeTokens=['authorizationToken','refreshToken']
        if(fetchToken.type && includeTokens.includes(fetchToken.type)){
            if(type=='refreshToken'){
                if(!fetchToken.token){
                    return false;
                }else{
                    //let validSessionToken1=Jwt.verify(sessionCache.get('user_'+fetchToken.id),process.env.JWT_PRIVATE_KEY);
                    let updatedToken= module.exports.decodeToken(fetchToken.token);
                    token=updatedToken;
                }
            }
            if(1==+process.env.ENABLE_SINGLE_SESSSION! && sessionCache.get('user_'+fetchToken.id)){
                let validSessionToken=Jwt.verify(sessionCache.get('user_'+fetchToken.id),process.env.JWT_PRIVATE_KEY);
                if(validSessionToken.data!=token.data){
                    return {
                        isValid: false
                    };
                }
            }else if(1==+process.env.ENABLE_SINGLE_SESSSION!){
                return {
                    isValid: false
                };
            }
        }
        var diff = Moment().diff(Moment(token.iat * 1000));
        if (diff > 0) {
            return {
                isValid: true,
                credentials: { userData: fetchToken, scope: fetchToken.permissions }
            };
        }
        return {
            isValid: false
        };
    }else{
        return false;
    }
};

const decodeToken = (token:string) => {
    let decodedToken = decode(token)!
    return decode(token)!;
};

const decryptData=(text:string)=>{
    if(text){
        let decrypted = crypto.AES.decrypt(text,process.env.DATA_KEY).toString(crypto.enc.Utf8)
        return JSON.parse(decrypted);
    }
};

const getTotalPages = async (records:number, perpage:number) => {
    let totalPages = Math.ceil(records / perpage);
    return totalPages;
};

const encryptData=(json:object)=>{
    let text = JSON.stringify(json);
    let encrypted = crypto.AES.encrypt(text, process.env.DATA_KEY).toString();
    return encrypted;
}

const  routeError = (errors: Joi.ErrorReport[], message: string)=>{
    errors.map((err: Joi.ErrorReport) => {
        switch (err.code) {
            case "any.required":
            case "any.empty":
            case "string.required":
            case "string.empty":
                err.message = message;
                break;
        }
        return err;
    });
    return errors;
}


const revokeSessionToken=(user:string)=>{
    sessionCache.del(user);
}

const headers = (authorized: 'authorized' | 'optionalauthorized' | null): GlobalHeaders=>{
    let globalHeaders: GlobalHeaders = {
      language: Joi.string().optional().allow(null).default(process.env.DEFAULT_LANGUAGE_CODE),
      countrycode: Joi.string().optional().allow(null).default(process.env.DEFAULT_COUNTRY_CODE),
      timezone: Joi.string().optional().allow(null).default("UTC"),
      connection: Joi.string().optional().allow(null).default("keep-alive"),
      devicetype: Joi.string().optional().allow(null),
      devicetoken: Joi.string().optional().allow(null),
    };
  
    if (authorized === 'authorized') {
      globalHeaders.authorization = Joi.string().required().description("Authorization token, for browser requests authorization cookie is in use");
    } else if (authorized === 'optionalauthorized') {
      globalHeaders.authorization = Joi.string().optional().description("Authorization token, for browser requests authorization cookie is in use");
    }
  
    return globalHeaders;
  }



  const FailureError = (err:  any  , request: any) => {
    const updatedError = err;
    updatedError.output.payload.message = [];
    const customMessages: Record<string, string> = {};

    if (err.isJoi && Array.isArray(err.details) && err.details.length > 0) {
        err.details.forEach((error: { context?: { label?: any }; message?: any }) => {
            const label = error.context?.label || '';
            const errorMessage = error.message || '';
            customMessages[label] = request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst(errorMessage));
        });
    }
    console.log(err,'===',request)
    delete updatedError.output.payload.validation;
    updatedError.output.payload.error = request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('BAD_REQUEST'));
    updatedError.output.payload.message = request.i18n.__(convertUnderscoreToSpaceAndCapitalizeFirst('ERROR_WHILE_VALIDATING_REQUEST'));
    updatedError.output.payload.errors = customMessages;

    return updatedError;
};


  
  
  const generateCode=(Requestedlength:number,type:number|string)=>{
    const char = type=='number'?'1234567890':'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; //Random Generate Every Time From This Given Char
    const length = typeof Requestedlength !='undefined' ? Requestedlength : 4;
    let randomvalue = '';
    for ( let i = 0; i < length; i++) {
      const value = Math.floor(Math.random() * char.length);
      randomvalue += char.substring(value, value + 1).toUpperCase();
    }
    return randomvalue;
  }  

  const signToken = (tokenData:object,type:string) => {
    try{
        let expirationTime:string|null;
        switch(type){
            case 'signup':
                expirationTime='30m';
                break;
            case 'authorizationToken':
                expirationTime='12h';
                break;
            case 'mobile-otp':
                expirationTime='5m';
                break;
            case '2faVerification':
                expirationTime='5m';
                break;
            case '2faAuthentication':
                expirationTime='5m';
                break;
            default:
                expirationTime=null;

        }
       let life={};
        
        if(expirationTime!=null){
             life={expiresIn:expirationTime};
        }
        // let life={expiresIn: '4m'};
        console.log("life of a token--------------->",life)
        console.log("tokenData-------==========>",tokenData)
        if(type == "authorizationToken"){
            //Token with no expiration time
            console.log("life of authorizationToken token-----------####--->",life)
            return Jwt.sign({ data: encrypt(JSON.stringify(tokenData))},process.env.JWT_PRIVATE_KEY);
        }else{
            console.log("life of refresh token-------------------->",life)
            return Jwt.sign({ data: encrypt(JSON.stringify(tokenData))},process.env.JWT_PRIVATE_KEY,life);
        }
        
    }catch(err){
        console.log(err);
        return false;
    }
};
const validSessionToken=(userId:number,token:string)=>{
    sessionCache.set('user_' + userId, token);
}  

const validateKeys=(obj:object,keys:Keys)=>{
    let verification = keys?.every(key => Object.keys(obj).includes(key));
    return verification
}



const  readHTMLFile = async(path:string) => {
    let html = await Fs.readFileSync(path, { encoding: "utf-8" });
    return html;
};

function arraysEqual(arr1:string[][], arr2:string[][]) {
    // Check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Iterate through each element and compare
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    // If all elements match, return true
    return true;
}

async function getDrivingDistance(origin: string, destination: string) {
    //const origin = '40.7128,-74.0060'; // New York City coordinates
    //const destination = '34.0522,-118.2437'; // Los Angeles coordinates

    let apiKey = process.env.GOOGLE_MAP_API_KEY;
    console.log(origin, destination, 'dddddddd2222');
    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${apiKey}`;
        const response = await axios.get(url);
        console.log(response.data.rows[0].elements[0].distance, 'dddddddd3333');
        const distance = response.data.rows[0].elements[0].distance;
        return distance;
    } catch (error) {
        console.error('Error fetching distance:', error);
        return null;
    }
}

async function getUserRoles(id: number){
    let query = `SELECT 
                    roles.code as role
                FROM
                    users_accounts
                        LEFT JOIN
                    user_roles ON user_roles.user_id = users_accounts.user_id
                        LEFT JOIN
                    roles ON roles.id = user_roles.role_id
                WHERE
                    users_accounts.user_id = ?`;
    let replacements = [id];
    interface totalRecords{
        role:string;
    }
    let records:totalRecords[] = await sequelize.query(query, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
    })   
    let roles = [];
    if(records && records.length > 0){
        for(let [index, obj] of records.entries()){
            roles.push(obj.role)
        }
    }
    console.log(records, 'ttttotal');
    return roles; 
}



const addTimeToDate = (time?: string|null) => {
    if(time){
        let array = time.split(":");
        console.log(array);
        let hrs = parseInt(array[0]);
        let minutes = parseInt(array[1]);
        let seconds = parseInt(array[2]);
        let date;
        return Moment().startOf('D').utc().add(hrs, "hours").add(minutes, 'minutes').add(seconds, 'seconds');
    }else{
        return Moment().startOf('D').utc();
        
    }
}



const createExclusionInclusionObjects = async (title: string,  languageCode: string,transaction:Sequelize.Transaction) => {
    const defaultLanguage = await Models.Language.findOne({ where: { 'code': process.env.DEFAULT_LANGUAGE_CODE } });
    const contentObject = { title};
    console.log("================================2")

    if (languageCode !== process.env.DEFAULT_LANGUAGE_CODE) {
        const requestedLanguage = await Models.Language.findOne({ where: { 'code': languageCode } });
        console.log("================================3")

        if (defaultLanguage && requestedLanguage) {
            const defaultLanguageObject = { ...contentObject, languageId: defaultLanguage.id };
            const requestedLanguageObject = { ...contentObject, languageId: requestedLanguage.id };
            return [defaultLanguageObject, requestedLanguageObject];
        } else {
         
            throw new Error('ERROR_WHILE_FETCHING_REQUIRED_LANGUAGE_FOR_CONTENT_CREATION');
            
           
        }
    } else {
        const defaultLanguageObject = { ...contentObject, languageId: defaultLanguage?.id };
        return [defaultLanguageObject];
    }
};


const createActivityInclusionExclsuion = async (
    TripActivityInclusionExclusion: string[],
    userId: number,
    newActivityId: number,
    languageCode: string,
    isInclusion:boolean,
    isForPackage:boolean,
    transaction: Sequelize.Transaction,
  ): Promise<{ success: boolean; isMatchedWithSlug?: boolean }> => {
    try {
      const activitySubTypeData = [];
  
      for (const subType of TripActivityInclusionExclusion) {
        const subSlug = await slugify(subType!);
        let subData:subData = {}
      
         subData = {
          createdBy: userId,
          code: `${subSlug}:activityId:${newActivityId}`,
          isInclusion:isInclusion
        };

        if(isForPackage){
            subData = {...subData, packageId: newActivityId}
        }else{
            subData = {...subData, tripActivityId: newActivityId}
        }
  

  
        console.log("================================1")
        const subContent = await createExclusionInclusionObjects(subType, languageCode, transaction);
        if (!subContent) {
          return { success: false, isMatchedWithSlug: false };
        }
  
        activitySubTypeData.push({
          ...subData,
          tripActivityInclusionExclusionContent: subContent,
        });
      }
  

  
      return { success: true, isMatchedWithSlug: false };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { success: false, isMatchedWithSlug: false };
    }
  };

export {
    validateToken,
    validSessionToken,
    decodeToken,
    decryptData,
    encryptData,
    generateError,
    routeError,
    headers,
    FailureError,
    convertHtmlToText,
    revokeSessionToken,
    generateCode,
    signToken,
    validateKeys,
    getTotalPages,
    slugify,
    readHTMLFile,
    arraysEqual,
    getDrivingDistance,
    addTimeToDate,
    getUserRoles,
    createActivityInclusionExclsuion,
    createExclusionInclusionObjects

}




