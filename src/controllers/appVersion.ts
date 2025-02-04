import Hapi from "@hapi/hapi";
import { tcpPingPort } from "tcp-ping-port";
import { Models, Sequelize, sequelize } from '../models';
import * as Common from "./common"

const getAppVersion = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let appVersion = await Models.AppVersion.findOne({
            attributes: [
                'ios_soft_update', 'ios_critical_update', 'android_soft_update', 'android_critical_update'
            ],
            where: { id: 1 }
        });
        let responseObject = JSON.parse(JSON.stringify(appVersion));
        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("APP_VERSION_INFORMATION")), responseData: responseObject }).code(200)
    } catch (err: unknown) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

const setAppVersion = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        let { ios_soft_update, ios_critical_update, android_soft_update, android_critical_update } = request.payload;
        let versionData = {
            ios_soft_update: ios_soft_update, ios_critical_update: ios_critical_update, android_soft_update: android_soft_update, android_critical_update: android_critical_update
        }
        const existingRecord = await Models.AppVersion.findOne({ where: { id: 1 } });
        if (existingRecord) {
            await existingRecord.update(versionData, { transaction: transaction });
        } else {
            await Models.AppVersion.create({ id: 1, ...versionData }, { transaction: transaction });
        }
        
        let appVersion = await Models.AppVersion.findOne({
            attributes: [
                'ios_soft_update', 'ios_critical_update', 'android_soft_update', 'android_critical_update'
            ],
            where: { id: 1, }, transaction
        });
        let responseObject;
        if (appVersion) {
            responseObject = JSON.parse(JSON.stringify(appVersion));
        } else {
            responseObject = null;
        }
        if (responseObject) {
            await transaction.commit();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("APP_VERSION_INFORMATION_UPDATED")), responseData: responseObject }).code(200)
        }
        else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'ERROR_IN_UPDATING_DATA',{});
        }
    } catch (err: unknown) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}
export {
    getAppVersion,
    setAppVersion
}