import  {Models, sequelize} from "../models";
import * as Common from './common';
import * as Constants from '../constants';
import Moment, { lang } from "moment";
import _ from "lodash";
import { Sequelize, Op } from "../config/dbImporter";
import requestIp from 'request-ip';
import * as Hapi from "@hapi/hapi";
import { Literal,Fn } from "sequelize/types/utils";
import { any, number } from "joi";
import { SettingsInterface } from "../config/interfaces";
const moment = require("moment");


const fetch = async () => {
    
    try{
        
        let data = await Models.Setting.findOne({
            attributes: [
                "tax"
            ]
        });
        return data;
    }catch(err){
        console.log(err);
        return false;
    }
}

export const updateSettings = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    const transaction = await sequelize.transaction();
    let userId = request.auth.credentials.userData.id;
    let accountId = request.auth.credentials.userData.accountId;
    let payload = request.payload; 
    try{
        let result = await Models.Setting.findOne();
        if(result){
            await Models.Setting.update(payload, {
                where: {id: result?.id}
            })
            
        }else{
            await Models.Setting.create(payload,{transaction:transaction});
        }

        let settingsData =  await fetch();
        
        if(!result){
            await transaction.rollback()
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SETTINGS_COULD_NOT_BE_UPDATED"))}).code(400);
        }else{
            await transaction.commit()
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SETTINGS_UPDATED")), responseData: JSON.parse(JSON.stringify(settingsData))}).code(200);
        }
    }catch(err){
        await transaction.rollback()
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

export const getSettings = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit)=>{
    
    try{
        let settingsData = await fetch();
        
        
        if(!settingsData){
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SETTINGS_COULD_NOT_BE_FETCHED"))}).code(400);
        }else{
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SETTINGS_FETCHED")), responseData: JSON.parse(JSON.stringify(settingsData))}).code(200);
        }
    }catch(err){
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}

