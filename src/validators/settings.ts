import { error } from "console";
import {Joi,Common,_} from "../config/routeImporter";

import { required } from 'joi';


const settingsRequest : Joi.ObjectSchema = Joi.object().keys({
    tax: Joi.number().required().error(errors=>{return Common.routeError(errors,'TAX_AMOUNT_IS_REQUIRED')}).example("18").description('For no tax you can add 0 for the tax'),
})

const generalSettingsRequest : Joi.ObjectSchema = Joi.object().keys({
    hotelCommissionRate:Joi.number().optional(),
    tourGuideCommissionRate:Joi.number().optional(),
    activitiesCommissionRate:Joi.number().optional(),
    flightCommissionRate:Joi.number().optional(),
})



export {
    settingsRequest,
    generalSettingsRequest
}

