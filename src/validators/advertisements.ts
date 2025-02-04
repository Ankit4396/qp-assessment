import {Joi,Common,_} from "../config/routeImporter";

const requestAdvertisement = {
    title:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'REQUIRED')}).example("Ad title"),
    detail:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'REQUIRED')}).example("Ad detail"),
    destinationId:Joi.number().optional().allow(null).example(1).description("Destination id"),
    themeId :Joi.number().optional().allow(null).example(1).description("Theme id"),
    startDate:Joi.date().required().error(errors=>{return Common.routeError(errors,'REQUIRED')}).example("2023-01-02T12:18:55.000Z").description("start date"),
    endDate:Joi.date().required().error(errors=>{return Common.routeError(errors,'REQUIRED')}).example("2023-01-02T12:18:55.000Z").description("end date"),
    adCountries: Joi.array().optional().items(Joi.number()).allow(null).description("Ads countries"),
    adThemes: Joi.array().items(Joi.number()).optional().min(0).description("Ads themes"),
};

const addAdvertisementRequest = Joi.object().keys(requestAdvertisement).label('ads-add-request').description("Ads add request");

const updateAdvertisementRequest = Joi.object().keys({...requestAdvertisement, id:Joi.number().required().error(errors=>{return Common.routeError(errors,'ADS_ID_IS_REQUIRED')}).example("12")}).label('ads-update-request').description("Ads update request");

const advertisementsListRequest = Joi.object().keys({
    searchText: Joi.string().trim().allow("").optional().default(null),
    page : Joi.number().optional().default(1),
    perPage:Joi.number().optional().min(1).default(parseInt(process.env.PAGINATION_LIMIT!)),
    status: Joi.number().optional().default(null),
    advertisementId: Joi.number().optional().default(null),
}).label('advertisement-list').description("Advertisements list");

const updateStatusRequest = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'ID_IS_REQUIRED')}).example("23"),
    status:Joi.number().valid(0, 1).required().error(errors=>{return Common.routeError(errors,'STATUS_IS_REQUIRED')}).example(1),
}).label('update-status-request').description("Update status request");

const deleteRequest = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'ID_IS_REQUIRED')}).example("23"),
}).label('delete-request').description("Delete request");

export {
    addAdvertisementRequest,
    updateAdvertisementRequest,
    advertisementsListRequest,
    updateStatusRequest,
    deleteRequest
}