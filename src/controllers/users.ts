import { Models, sequelize } from "../models";
import * as Common from "./common";
import * as Constants from "../constants";
import Bcrypt from "bcrypt";
import Moment from "moment-timezone";
import _, { update } from "lodash";
import { Sequelize, Op } from "../config/dbImporter";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import verifyAppleToken from "verify-apple-id-token";
import axios, { Axios, AxiosResponse } from 'axios';
import cookie from 'cookie';
import twilio from "twilio";
import requestIp from 'request-ip';
import { hapi } from "hapi-i18n"
import { request } from "http";
import * as Hapi from "@hapi/hapi";
import NodeCache from "node-cache";
import { Model, QueryTypes, WhereOptions } from 'sequelize';
import { UserInterface, UserSetting, UserAccount, UserProfileInterface, UserDetails } from "../config/interfaces";
import { object, string } from "joi";
//import hapiAuthJwt2 from "hapi-auth-jwt2";
import { VerificationAttemptInstance } from "twilio/lib/rest/verify/v2/verificationAttempt";
import { VerificationAttemptsSummaryContextImpl } from "twilio/lib/rest/verify/v2/verificationAttemptsSummary";
import { UserDetail } from "aws-sdk/clients/iam";
import { Boom, isBoom } from "@hapi/boom";
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";
import { bool } from "aws-sdk/clients/signer";
import { validate } from "uuid";
import { Console, time } from "console";
import { transcode } from "buffer";
import { IncomingClientScope } from "twilio/lib/jwt/ClientCapability";
import { Json, Literal } from "sequelize/types/utils";
import { OrderItem } from 'sequelize';
var md5 = require('md5');

type AttributeElement = string | [Literal, string];

const TWILIOSID = process.env.TWILIO_ACCOUNT_SID;
const TWILIOAUTHTOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(TWILIOSID, TWILIOAUTHTOKEN);
let sessionCache = new NodeCache();

const attributes: AttributeElement[] = [
    'id', 'code', 'status', 'isRevision', 'createdAt', 'updatedAt', "drivers", "orders", "supportHours", "isRealTimeTrackingAndSMS", "numbeOfStaffMembers",
    [sequelize.literal('(case when `UserSubscription->Plan->content`.name is not null then `UserSubscription->Plan->content`.name else `UserSubscription->Plan->defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `UserSubscription->Plan->content`.description is not null then `UserSubscription->Plan->content`.description else `UserSubscription->Plan->defaultContent`.description END)'), 'description'],
    [sequelize.literal('(case when `UserSubscription->Plan->content`.description_text is not null then `UserSubscription->Plan->content`.description_text else `UserSubscription->Plan->defaultContent`.description_text END)'), 'descriptionText'],
    // [sequelize.literal('(case when `UserSubscription->Plan->content`.features is not null then `UserSubscription->Plan->content`.features else `UserSubscription->Plan->defaultContent`.features END)'), 'features'],
];

const rolePermissions: AttributeElement[] = [
    'id',
    [sequelize.literal('(case when `Permissions->content`.name is not null then `Permissions->content`.name else `Permissions->defaultContent`.name END)'), 'name'],
    [sequelize.literal('(case when `Permissions->content`.description is not null then `Permissions->content`.description else `Permissions->defaultContent`.description END)'), 'description']
]


const attributesAddress: AttributeElement[] = [
    'id', 'userId', 'isdefaultAddress', 'type', 'latitude', 'longitude', 'mapAddress', 'title', 'addressLine1', 'addressLine2', 'additionalInformation', 'userLinkName', 'mobile'
    
    
];

const attributesRiderProfile:AttributeElement[]=[
    'id',"userId",'userId','countryCode','mobile','emergencyCountryCode','emergencyContact','emergencyContactRelation','emergencyContactRelationName','name','imageId','gender','aadhaarNumber','startShiftTime','endShiftTime','bloodGroup','dateOfBirth', 'vehicleNumber'
]

const paymentGatewayAttributes = ['paymentGateway', 'paymentGatewayPlanId', 'amount', 'currency', 'tenure']

// Apple login public key to verify auth token 
const appleKey = async (kid: string) => {
    const client = jwksClient({
        jwksUri: process.env.APPLE_AUTH_KEY_URL!,
        timeout: 30000
    });
    return await client.getSigningKey(kid);
}

// generate QR code for two factor authentication
const generate2fadata = async (email: string) => {
    let secret = await speakeasy.generateSecret({ name: email });
    let dataUrl: string = secret?.otpauth_url ?? '';
    let qcode = await qrcode.toDataURL(dataUrl);
    return { qrcode: qcode, secret: secret.ascii, encoding: process.env.ENCODING_2FA };
}


const removeUndefinedFields = async <T>(obj: T): Promise<Partial<T>> => {
    const newObj: Partial<T> = {};
    for (const key in obj) {
        if (obj[key as keyof T] !== undefined &&  obj[key as keyof T] !== null) {
            newObj[key as keyof T] = obj[key as keyof T];
        }
    }
    return newObj;
};

const generateRandomPassword = (length: number) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);
    }
    return password;
}










// Send OTP for mobile login using msg91 or twilio
const sendOTP = async (mobile: string, platform: string) => {
    try {
        console.log(`Sending OTP to ${mobile} via ${platform}`);
        console.log(mobile);
        let params;
        switch (platform) {
            case 'msg91':
                params = {
                    template_id: process.env.MSG91_TEMPLET_ID,
                    mobile,
                    otp_length: 6,
                    otp_expiry: 5,
                    authkey: process.env.MSG91_AUTH_KEY,
                }
                if (+process.env.MASTER_CODE_FLAG!) {
                    let code = process.env.MASTER_CODE;
                    console.log(`Returning MASTER_CODE: ${code}`);
                    return code;
                }
                if (process.env.NODE_ENV == 'TEST') {
                    params = _.assign(params, { code: process.env.MASTER_CODE })
                }
                const config = {
                    url: process.env.MSG91_SEND_MSG,
                    method: 'get',
                    params: params
                }
                try {
                    let response = await axios.request(config);
                    console.log(`Response from MSG91:`, response.data);
                    if (response.status === 200) {
                        console.log("here is sms ", response)
                        console.log(`OTP sent to ${response.data.request_id ? response.data.request_id : response.data.message}`);
                        return response.data.request_id ? response.data.request_id : response.data.message;

                    } else {
                        console.log(`Unexpected status code: ${response.status}`);
                        return false;
                    }
                } catch (err) {
                    console.log("error")
                }
                break;
            case 'twilio':
                params = { to: mobile.toString(), channel: 'sms' }
                if (+process.env.MASTER_CODE_FLAG!) {
                    let code = process.env.MASTER_CODE;
                    return code;
                }
                if (process.env.NODE_ENV == 'TEST') {
                    params = _.assign(params, { customCode: process.env.MASTER_CODE })
                }
                try {
                    let response = await twilioClient.verify.v2.services(process.env.TWILIO_SERVICE_SID!).verifications.create(params);
                    if (response.status == 'pending') {
                        return true;
                    } else {
                        return false;
                    }
                } catch (err) {
                    return false;
                }
                break;
        }
    } catch (err) {
        console.log('Error in sending OTP', err);
        return false;
    }
}

// verify OTP sent from sendOTP method 
const verifyMobileOTP = async (mobile: string, otp: number, platform: string) => {
    try {
        console.log(mobile);
        let response: AxiosResponse;
        switch (platform) {
            case 'msg91':
                if (+process.env.MASTER_CODE_FLAG! === 1) {
                    if (+process.env.MASTER_CODE! == otp) {
                        return true;
                    } else {
                        return false;
                    }
                }
                const config = {
                    url: process.env.MSG91_VERIFY_OTP,
                    method: 'get',
                    params: {
                        otp,
                        mobile,
                        authkey: process.env.MSG91_AUTH_KEY
                    }
                }
                response = await axios.request(config);
                if (response.data.message == "OTP verified success") {
                    return true;
                } else {
                    return false;
                }
                break;
            case 'twilio':
                if (+process.env.MASTER_CODE_FLAG! === 1) {
                    if (+process.env.MASTER_CODE! == otp) {
                        return true;
                    } else {
                        return false;
                    }
                }
                let response1 = await twilioClient.verify.v2.services(`${process.env.TWILIO_SERVICE_SID}`).verificationChecks.create({ to: mobile.toString(), code: otp.toString() });
                if (response1.status == 'approved') {
                    return true;
                } else {
                    return false;
                }
        }
    } catch (err) {
        console.log('Error while verifying OTP', err);
        return false;
    }
}

// resend OTP either in text or voice format (type can be text or voice)
const resend_OTP = async (mobile: number, platform: string, type: string) => {
    try {
        let params
        switch (platform) {
            case 'msg91':
                params = {
                    retrytype: type,
                    mobile,
                    otp_length: 4,
                    otp_expiry: 5,
                    authkey: process.env.MSG91_AUTH_KEY
                }
                if (+process.env.MASTER_CODE_FLAG!) {
                    return true;
                }
                if (process.env.NODE_ENV == 'TEST') {
                    params = _.assign(params, { code: process.env.MASTER_CODE })
                }
                const config = {
                    url: process.env.MSG91_RESEND_MSG,
                    method: 'get',
                    params: params
                }
                try {
                    let response = await axios.request(config);
                    if (response.status == 200) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (err) {
                    console.log("OTP sending error", err)
                }
                break;

            case 'twilio':
                let twiliotype = type == 'text' ? 'sms' : 'call';
                params = { to: mobile.toString(), channel: twiliotype }
                if (+process.env.MASTER_CODE_FLAG!) {
                    return true;
                }
                if (process.env.NODE_ENV == 'TEST') {
                    params = _.assign(params, { customCode: process.env.MASTER_CODE })
                }
                try {
                    let response = await twilioClient.verify.v2.services(process.env.TWILIO_SERVICE_SID!).verifications.create(params);
                    if (response.status == 'pending') {
                        return true;
                    } else {
                        return false;
                    }
                } catch (err) {
                    console.log("OTP sending error", err)
                }
                break;
        }
    } catch (err) {
        console.log('Error while resending OTP', err);
        return false;
    }
}

// generate user login data after successful login, common with all types of login


// ...








const loginToken = async (timezone: string, userId: number | null | undefined, accountId: number | null | undefined, language: string | null, transaction: Sequelize.Transaction | null, readAccess: PermissionState | null) => {
    try {

        let where: WhereOptions = {
            id: userId
        };
        let profileImage = await Models.User.findOne({ where: where });
        let searchImageId = null;
        if (profileImage && profileImage.imageId) {
            searchImageId = profileImage.imageId;
        }
        let validateUser = await Models.User.findOne({
            include: [
                {
                    attributes: [
                        "name", "gender", "imageId", "stateId", "pin", "address1", "address2", "address3", "occupation",
                        //[sequelize.fn('CONCAT', process.env.FILE_PATH, sequelize.literal('`UserProfile->profileImage`.`unique_name`')), 'profile_Image']
                    ],
                    model: Models.UserProfile,
                    include: [
                        {
                            attributes: [
                                "id", "extension", "type", "uniqueName",
                                [sequelize.fn('CONCAT', process.env.FILE_PATH, sequelize.literal('`UserProfile->profileImage`.`unique_name`')), 'filePath']
                            ],
                            model: Models.Attachment,
                            as: 'profileImage',
                            required: false,
                        },
                        // { 
                        //     attributes: ["countryId", "state"],
                        //     model: Models.State
                        // }
                    ],
                },
                
                {
                    attributes: [
                        'id',
                        'code',
                        'status',
                        //[sequelize.literal('(case when `Roles->content`.name is not null then `Roles->content`.name else `Roles->defaultContent`.name END)'), 'name']
                    ],
                    model: Models.Role,
                    required: false,
                    where: { status: Constants.STATUS.ACTIVE},
                    include: [
                        {
                            attributes: [],
                            required: false,
                            subQuery: false,
                            model: Models.RoleContent, as: 'content',
                            include: [{
                                model: Models.Language,
                                where: { code: language },
                                attributes: []
                            }],
                        },
                        {
                            attributes: [],
                            model: Models.RoleContent, as: 'defaultContent',
                            required: true,
                            subQuery: false,
                            include: [{
                                attributes: [],
                                model: Models.Language,
                                where: { code: process.env.DEFAULT_LANGUAGE_CODE }

                            }]
                        },
                        {
                            attributes: [
                                'code',
                                'status',
                                [sequelize.literal('(case when `Roles->Permissions->content`.name is not null then `Roles->Permissions->content`.name else `Roles->Permissions->defaultContent`.name END)'), 'name']
                            ],
                            model: Models.Permission,
                            // where: { status: Constants.STATUS.ACTIVE, [Op.or]: [{ accountId: accountId }, { accountId: null }] },
                            required: false,
                            // subQuery: false,
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
                    through: {
                        attributes: []
                    }
                },
                {
                    attributes: ["twoFactorAuthentication", "skipSubscriptionPage", "skipDashboardTour", "hasUniversalNominee", "kycStatus"],
                    required: false,
                    model: Models.UserSetting
                },
                {
                    attributes: [
                        "id", "extension", "type", "uniqueName",
                        [sequelize.fn('CONCAT', process.env.FILE_PATH,  sequelize.literal('`Attachment`.`unique_name`')), 'filePath']
                    ],
                    required: false,
                    model: Models.Attachment,
                    where: { id: searchImageId, userId: userId }
                }
                
            ],
            where: where,
            subQuery: false,
            transaction: transaction
        });

        console.log("userdaa__________________",JSON.parse(JSON.stringify(validateUser)));
        

        if (validateUser) {
            
            // console.log("================================", validateUser)
            const { id, countryCode, email, mobile, createdAt, updatedAt, status } = validateUser;
            const timeStamp = Moment.utc();
            let permissions = [];
            for (const role of validateUser.Roles!) {
                permissions.push(role.code);
                for (const permission of role.Permissions!) {
                    permissions.push(permission.code);
                }
            }
            permissions = [... new Set(permissions)]
            let token = null;
            let refreshToken = null;
            if (!readAccess) {
                token = Common.signToken({ id: id, name: validateUser.UserProfile?.name, profileImage: validateUser.UserProfile?.imageId, accountId: accountId, email: email, mobile, createdAt: createdAt, updatedAt: updatedAt, status: status, timeStamp: timeStamp, applicationCode: process.env.APPLICATION_CODE, permissions: permissions, type: 'authorizationToken', timezone: timezone }, 'authorizationToken');
                refreshToken = Common.signToken({ token: token, id: id, accountId: accountId, type: 'refreshToken', timezone: timezone }, 'refreshToken');
                Common.validSessionToken(validateUser.id!, token);
            }
            let attachment;
            if (validateUser.Attachment) {
                validateUser.Attachment = JSON.parse(JSON.stringify(validateUser.Attachment));
                if (validateUser.Attachment?.uniqueName) {
                    validateUser.Attachment.filePath = process.env.API_PATH + validateUser.Attachment.uniqueName
                }

                attachment = { id: validateUser.Attachment?.id, filePath: validateUser.Attachment?.filePath, extension: validateUser.Attachment?.extension, type: validateUser.Attachment?.type }
            }

            let categoryDetails;
            let businessProfile;
            
            

            
            
            if (token && refreshToken && validateUser) {
                return {
                    id: validateUser.id,
                    onlineStatus: validateUser.onlineStatus,
                    accountId: accountId,
                    countryCode: validateUser.countryCode,
                    email: validateUser.email,
                    mobile: validateUser.mobile,
                    createdAt: validateUser.createdAt,
                    updatedAt: validateUser.updatedAt,
                    status: status,
                    token: token,
                    refreshToken: refreshToken,
                    UserProfile: JSON.parse(JSON.stringify(validateUser.UserProfile)),
                    Roles: JSON.parse(JSON.stringify(validateUser.Roles)),
                    UserSettings: validateUser.UserSettings ? JSON.parse(JSON.stringify(validateUser.UserSettings)) : null,
                    Attachment: validateUser.Attachment ? attachment : null,
                    
                }
            } else if (readAccess && validateUser) {
                return {
                    id: validateUser.id,
                    accountId: accountId,
                    email: validateUser.email,
                    mobile: validateUser.mobile,
                    createdAt: validateUser.createdAt,
                    updatedAt: validateUser.updatedAt,
                    status: status,
                    UserProfile: JSON.parse(JSON.stringify(validateUser.UserProfile)),
                    Roles: JSON.parse(JSON.stringify(validateUser.Roles)),
                    UserSettings: JSON.parse(JSON.stringify(validateUser.UserSettings)),
                    Attachment: JSON.parse(JSON.stringify(validateUser.Attachment)),
                    
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}



// Generate signup token for a user
export const signup = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { name, email, password } = request.payload;
        let existingEmail = await Models.User.findOne({ where: { email: email } });
        // stop execution for existing users
        if (existingEmail) {
            await transaction.rollback();
            return Common.generateError(request, 400, 'EMAIL_ID_ALREADY_IN_USE', {});
        } else {
            let tokenType = 'signup';
            let verificationsAttempts = 0;
            let token = Common.signToken({ email: email, password: password, name: name, type: tokenType }, tokenType);
            let code = Common.generateCode(4, 'number');
            if (process.env.NODE_ENV == 'TEST') {
                code = process.env.MASTER_CODE!;
            }
            if (token && code) {
                console.log("here in code")
                console.log({
                    email: email,
                    token: token,
                    code: code,
                    status: Constants.STATUS.ACTIVE,
                    type: tokenType,
                    verificationsAttempts: verificationsAttempts
                })
                let saveToken = await Models.Token.create({
                    email: email,
                    token: token,
                    code: code,
                    status: Constants.STATUS.ACTIVE,
                    type: tokenType,
                    verificationsAttempts: verificationsAttempts
                }, { transaction: transaction });
                if (saveToken) {
                    await transaction.commit();
                
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("VERIFICATION_EMAIL_SENT_TO_EMAIL_ID")), responseData: { token: token } }).code(200);
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 500, 'ERROR_WHILE_GENERATING_VERIFICATION_TOKEN', Error);
                }
            } else {
                await transaction.rollback();
                return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WHILE_GENERATING_TOKEN_AND_CODE', {});
            }
        }
    }
    catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// Validate a token if its active or has been utilized
export const validateToken = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let { token, type } = request.query;
        let validateToken = await Common.validateToken(Common.decodeToken(token), type);
        if (validateToken) {
            if (validateToken?.isValid) {
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("TOKEN_VALIDATED_SUCCESSFULLY")) }).code(200);
            } else {
                return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
            }
        } else {
            return Common.generateError(request, 400, 'Token ISSUE', {});
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// verify user email usng signuptoken and code shared via email
export const verifyEmail = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { token, code } = request.payload;
        let tokenType = 'signup';
        let validateToken = await Models.Token.findOne({ where: { token: token, type: tokenType, status: Constants.STATUS.ACTIVE } });
        if (process.env.INVALID_ATTEMPTS != undefined && validateToken && validateToken.verificationsAttempts < +process.env.INVALID_ATTEMPTS && code == validateToken.code) {
            await validateToken.increment('verificationsAttempts', { by: 1, transaction: transaction });
            let tokenData = await Common.validateToken(Common.decodeToken(token), tokenType);
            let requiredKeys = ["email", "password"];
            if (tokenData) {
                let validateKeys = Common.validateKeys(tokenData.credentials?.userData, requiredKeys);

                if (tokenData && tokenData?.isValid && validateKeys) {
                    await validateToken.update({ status: Constants.STATUS.INACTIVE }, { transaction: transaction });
                    const rounds = parseInt(process.env.HASH_ROUNDS!);
                    const userPassword = Bcrypt.hashSync(tokenData.credentials?.userData.password, rounds);
                    const { email, mobile } = tokenData.credentials?.userData;
                    const profile = { name: tokenData.credentials?.userData.name }
                    const settings = { twoFactorAuthentication: false }
                    const newUser = await Models.User.create({ email: email, mobile: mobile, password: userPassword, status: Constants.STATUS.ACTIVE, UserProfile: profile, UserSettings: settings }, { include: [{ model: Models.UserProfile }, { model: Models.UserSetting }], transaction: transaction });
                    let accountId = null;
                    if (+process.env.SAAS_ENABLED!) {
                        await Models.UserAccount.create({ accountId: newUser.id, userId: newUser.id, isDefault: true }, { transaction: transaction });
                        accountId = newUser.id;

                    } else {
                        await Models.UserAccount.create({ accountId: null, userId: newUser.id, isDefault: true }, { transaction: transaction });
                    }
                    const userRole = await Models.Role.findOne({ where: { code: process.env.DEFAULT_USER_ROLE }, transaction: transaction });
                    

                    if(userRole && userRole.id){
                        await newUser.setRoles([userRole.id], { transaction: transaction })
                        // update nominee invitation with user id sent before registration
                        
                        
                    }else{
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'SYSTEM_HAS_NOT_BEEN_INITIALZED_WITH_DEFAULT_ROLES', {});
                    }
                    
                }
            } else {
                await transaction.rollback();
                if (validateToken) {
                    await validateToken.increment(['verificationsAttempts'], { by: 1 });
                }
                return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
            }
        } else {
            await transaction.rollback();
            if (validateToken) {
                await validateToken.increment('verificationsAttempts', { by: 1 });
            }
            return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN_OR_CODE', {});
        }
    } catch (err) {
        console.log("err",err);
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}


// login with mobile and password
export const mobileAndPasswordLogin = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { countryCode, mobile, password, code, fcmToken } = request.payload;
        let varifificationAttempts = 0;
        const validateAccount = await Models.User.findOne({ where: { countryCode: countryCode, mobile: mobile }, include: [{ model: Models.UserSetting }] });
        if (validateAccount && validateAccount.password) {
            let email = validateAccount.email!;
            let passwordVerification = Bcrypt.compareSync(password, validateAccount.password);
            //console.log(passwordVerification && validateAccount.status,Constants.STATUS.ACTIVE);
            if (passwordVerification && validateAccount.status == Constants.STATUS.ACTIVE) {
                let defaultAccount = await Models.UserAccount.findOne({ where: { userId: validateAccount.id, isDefault: true } });
                let getDatafor = +process.env.SAAS_ENABLED! ? defaultAccount?.accountId : null;
                if (+process.env.ENABLE_2FA! && validateAccount.UserSettings?.twoFactorAuthentication) {
                    let tokenType = '2faVerification';
                    let token = Common.signToken({ secret: validateAccount.secret, id: validateAccount.id, accountId: getDatafor, type: tokenType }, tokenType);
                    let saveToken = await Models.Token.upsert({
                        id: validateAccount.id,
                        token: token,
                        status: Constants.STATUS.ACTIVE,
                        type: tokenType,
                        code: code,
                        verificationsAttempts: varifificationAttempts
                    },
                        { fields: ['mobile', 'type'], transaction: transaction });
                    if (fcmToken) {
                        Models.User.update({ fcmToken: fcmToken }, { where: { mobile: mobile }, transaction: transaction });
                    }
                    await transaction.commit();
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("VERIFICATION_TOKEN_GENERATED_SUCCESSFULly")), responseData: { verification: { token: token } } }).code(200)
                } else {
                    console.log("====else ================================")
                    const userData = await loginToken(request.headers.timezone, validateAccount.id!, getDatafor!, request.headers.language, transaction, request.headers.permissions);
                    console.log("this is userData =============================", userData);
                    const clientIp = requestIp.getClientIp(request);
                    if (userData) {
                     
                        if (fcmToken) {
                            Models.User.update({ fcmToken: fcmToken }, { where: { mobile: mobile }, transaction: transaction });
                        }
                        await transaction.commit();
                        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("LOGIN_SUCCESSFULLY")), responseData: { user: userData } }).code(200);
                    } else {
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'Data Inavalidate', {});
                    }
                }
            } else {
                if (validateAccount.status != Constants.STATUS.ACTIVE) {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'INVALID_SUSPENDED_CONTACT_ADMIN', {});
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'INVALID_PASSWORD', {});
                }
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_CREDENTIALS', {});
        }
    }
    catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }

}

// login with mobile and OTP
export const mobileLogin = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { countryCode, mobile, name } = request.payload;
        let { signUpSource } = request.query;
        let lastOTPIn30Sec = await Models.Token.findOne({
            where: {
                [Op.and]: [{ type: 'mobile-otp', countryCode: countryCode, mobile: mobile }, sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal("SECOND"), sequelize.col('updated_at'), sequelize.fn("NOW")), {
                    [Op.lt]: 30
                })]
            }
        });
        // stop execution if OTP has been sent in past 30 sec
        if (!lastOTPIn30Sec) {
            let sendOTPTo = countryCode.concat(mobile);
            let verificationsAttempts = 0
            let sentOTP = await sendOTP(sendOTPTo, process.env.SMS_GATEWAY_TO_USE!);
            if (sentOTP) {
                let tokenType = "mobile-otp";
                let token = Common.signToken({ countryCode: countryCode, mobile: mobile, signUpSource: signUpSource }, tokenType);
                let saveToken = await Models.Token.create({
                    countryCode: countryCode,
                    mobile: mobile,
                    token: token,
                    code: sentOTP,
                    status: Constants.STATUS.ACTIVE,
                    type: tokenType,
                    verificationsAttempts: verificationsAttempts,
                }, { transaction: transaction });
                if (saveToken) {
                    let existingUser = await Models.User.findOne({ where: { mobile: mobile } });
                    let userExist: boolean = false;
                    if (existingUser && existingUser.isNewRecord == false) {
                        userExist = true;
                    }
                    await transaction.commit();
                    return h.response({ message: request.i18n.__("OTP sent to mobile number"), responseData: { token: token, isUserExist: userExist } }).code(200);
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 500, 'ERROR_WHILE_GENERATING_VERIFICATION_TOKEN', {});
                }
            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'ERROR_WHILE_SENDING_OTP', {});
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'OTP_CANNOT_BE_RESENT_WITHIN_30_SEC', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const mobileNumberUpdate = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { countryCode, mobile, name } = request.payload;

        let authUserMobile = request.auth.credentials.userData.mobile;
        let mobileDetails = await Models.User.findOne({ where: { mobile: mobile } })
        console.log(mobileDetails)
        if (mobile == authUserMobile || mobileDetails != null) {
            await transaction.rollback();
            return Common.generateError(request, 409, 'MOBILE_NUMBER_ALREADY_EXIST', {});

        }
        let lastOTPIn30Sec = await Models.Token.findOne({
            where: {
                [Op.and]: [{ type: 'mobile-otp', countryCode: countryCode, mobile: mobile }, sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal("SECOND"), sequelize.col('updated_at'), sequelize.fn("NOW")), {
                    [Op.lt]: 30
                })]
            }
        });
        // stop execution if OTP has been sent in past 30 sec
        if (!lastOTPIn30Sec) {
            let sendOTPTo = countryCode.concat(mobile);
            let verificationsAttempts = 0
            let sentOTP = await sendOTP(sendOTPTo, process.env.SMS_GATEWAY_TO_USE!);
            if (sentOTP) {
                let tokenType = "mobile-otp";
                let token = Common.signToken({ countryCode: countryCode, mobile: mobile }, tokenType);
                let saveToken = await Models.Token.create({
                    countryCode: countryCode,
                    mobile: mobile,
                    token: token,
                    code: sentOTP,
                    status: Constants.STATUS.ACTIVE,
                    type: tokenType,
                    verificationsAttempts: verificationsAttempts,
                }, { transaction: transaction });
                if (saveToken) {
                    let existingUser = await Models.User.findOne({ where: { mobile: mobile } });
                    let userExist: boolean = false;
                    if (existingUser && existingUser.isNewRecord == false) {
                        userExist = true;
                    }
                    await transaction.commit();
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("OTP_SEND_TO_MOBILE_NO")), responseData: { token: token, isUserExist: userExist } }).code(200);
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 500, 'ERROR_WHILE_GENERATING_VERIFICATION_TOKEN', {});
                }
            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'ERROR_WHILE_SENDING_OTP', {});
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'OTP_CANNOT_BE_RESENT_WITHIN_30_SEC', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// resend OTP (cannot be triggered within 30 sec of last OTP sent)
export const resendOTP = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { token, type } = request.payload;
        let tokenType = 'mobile-otp';
        let validateToken = await Models.Token.findOne({ where: { token: token, type: tokenType, status: Constants.STATUS.ACTIVE } });
        if (validateToken) {
            let tokenData = await Common.validateToken(Common.decodeToken(token), tokenType);
            if (tokenData) {
                let requiredKeys = ["countryCode", "mobile"];
                let validateKeys = Common.validateKeys(tokenData?.credentials?.userData, requiredKeys);
                let { countryCode, mobile, name } = tokenData?.credentials?.userData;
                let lastOTPIn30Sec = await Models.Token.findOne({
                    where: {
                        [Op.and]: [{ type: 'mobile-otp', countryCode: countryCode, mobile: mobile }, sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal("SECOND"), sequelize.col('updated_at'), sequelize.fn("NOW")), {
                            [Op.lt]: 30
                        })]
                    }
                });
                if (!lastOTPIn30Sec) {
                    // await lastOTPIn30Sec.increment('verificationsAttempts',{by:1,transaction:transaction});
                    if (tokenData && tokenData?.isValid && validateKeys) {
                        let sentOTPTo = tokenData?.credentials?.userData.countryCode.concat(tokenData.credentials.userData.mobile);
                        let newOTP = await resend_OTP(sentOTPTo, process.env.SMS_GATEWAY_TO_USE!, type);
                        if (newOTP) {
                            await transaction.commit();
                            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("OTP_SEND_TO_MOBILE_NO")) }).code(200)
                        } else {
                            await transaction.rollback();
                            return Common.generateError(request, 400, 'ERROR_WHILE_SENDING_OTP', {});
                        }
                    } else {
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
                    }
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'OTP_CANNOT_BE_RESENT_WITHIN_30_SEC', Error);
                }
            }
            else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'TOKEN_DOES_NOT_EXISTS', {});
            }

        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// verify OTP sent to user mobile no, on successfull verification account access would be granted to the user
export const verifyOTP = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { token, code, fcmToken } = request.payload;
        console.log("=============", token, code, fcmToken)
        let authUser = request.auth.isAuthenticated ? request.auth.credentials.userData.id : null;
        console.log("authUser----> ", authUser)
        let tokenType = 'mobile-otp'
        let validateToken = await Models.Token.findOne({ where: { token: token, type: tokenType, status: Constants.STATUS.ACTIVE } });

        if (validateToken && validateToken.verificationsAttempts < +process.env.INVALID_ATTEMPTS!) {
            await validateToken.increment('verificationsAttempts', { by: 1, transaction: transaction });
            let tokenData = await Common.validateToken(Common.decodeToken(token), tokenType);
            if (validateToken.mobile && tokenData && tokenData?.isValid) {
                if (authUser) {
                    let authUserMobile = request.auth.credentials.userData.mobile;
                    if (authUserMobile === validateToken.mobile) {
                        console.log("authUserMobile === validateToken.mobile", authUserMobile, validateToken.mobile)
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'MOBILE_NUMBER_ALREADY_EXIST', {});
                    }
                }
                let sentOTPTo = validateToken.countryCode?.concat(validateToken.mobile);
                let verifyOTP = await verifyMobileOTP(sentOTPTo!, code, process.env.SMS_GATEWAY_TO_USE!);
                console.log("verifyOTP================================", verifyOTP)
                // exit if OTP verification failed
                if (!verifyOTP) {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'INVALID_CODE', {});
                }
                await validateToken.update({ status: Constants.STATUS.INACTIVE }, { transaction: transaction });
                let countryCode = validateToken?.countryCode;
                let mobile = validateToken?.mobile;
                let signUpSource = tokenData.credentials?.userData?.signUpSource;
                let existingUser;
                if (authUser) {

                    let data =await Models.User.update({ mobile: mobile }, { where: { id: authUser }, transaction: transaction });
                    console.log("User Updated Data -------1----->",data);
                    let userAccount = await Models.UserAccount.findOne({ where: { userId: authUser, isDefault: true } })
                    if (fcmToken) {
                        let data =await Models.User.update({ fcmToken: fcmToken }, { where: { mobile: mobile }, transaction: transaction });
                        console.log("User Updated Data inside fcm -------2----->",data);
                    }
                    let userData = await loginToken(request.headers.timezone, authUser, userAccount?.accountId, request.headers.language, transaction, null);
                    if (userData) {
                        console.log("User Data loginToken-------3----->",userData);
                        const clientIp = requestIp.getClientIp(request);
                        await transaction.commit();
                        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("OTP VERIFIED SUCCESSFULLY")), responseData: { user: userData } }).code(200);
                    } else {
                        console.log("inside else 1----->",userData);
                        await transaction.rollback();
                        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
                    }

                } else {
                    if (countryCode && mobile) {
                        existingUser = await Models.User.findOne({ where: { countryCode: countryCode, mobile: mobile } });
                        let userData = {};
                        console.log("existingUser----->",existingUser);
                        // create user account with mobile no if not an existing user
                        if (!existingUser) {
                            console.log("User sign up source----->",signUpSource)
                            let AuthUser = request.auth.isAuthenticated ? request.auth.credentials.userData.id : null;
                            // Create new account with mobile no
                           // const profile = { name: validateToken.mobile }
                            const settings = { twoFactorAuthentication: false }
                            const newUser = await Models.User.create({ email: null, signUpSource: signUpSource, mobile: mobile, password: null, countryCode: countryCode, fcmToken: fcmToken, status: Constants.STATUS.ACTIVE, UserSettings: settings }, { include: [{ model: Models.UserProfile }, { model: Models.UserSetting }], transaction: transaction });
                            let accountId = null;
                            if (process.env.SAAS_ENABLED) {
                                await Models.UserAccount.create({ accountId: newUser.id, userId: newUser.id, isDefault: true }, { transaction: transaction });
                                accountId = newUser.id;

                            } else {
                                await Models.UserAccount.create({ accountId: null, userId: newUser.id, isDefault: true }, { transaction: transaction });
                            }
                            const userRole = await Models.Role.findOne({ where: { code: process.env.DEFAULT_USER_ROLE }, transaction: transaction });
                            
                            if(userRole && userRole.id){
                                await newUser.setRoles([userRole.id], { transaction: transaction })
                                userData = await loginToken(request.headers.timezone, newUser.dataValues.id!, accountId!, request.headers.language, transaction, null);

                                
                            }else{
                                await transaction.rollback();
                                return Common.generateError(request, 400, 'SYSTEM_HAS_NOT_BEEN_INITIALZED_WITH_DEFAULT_ROLES', {});
                            }
                            

                        } else {
                            //return Common.generateError(request,400,'MOBILE_NO_ALREADY_IN_USE',{});
                            let userAccount = await Models.UserAccount.findOne({ where: { userId: existingUser.id, isDefault: true } })
                            if (fcmToken) {
                                Models.User.update({ fcmToken: fcmToken }, { where: { mobile: mobile }, transaction: transaction });
                            }
                            userData = await loginToken(request.headers.timezone, existingUser.id, userAccount?.accountId, request.headers.language, transaction, null);
                        }
                        if (userData) {
                            await transaction.commit();
                            //h.state('authorization',userData.token);
                            const clientIp = requestIp.getClientIp(request);
                            //await Common.logActivity('UPDATED_MOBILE',{name:request.auth.credentials.userData.name,ip:clientIp},request.auth.credentials.userData.id,request.auth.credentials.userData.accountId,clientIp,null)
                            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("OTP VERIFIED SUCCESSFULLY")), responseData: { user: userData } }).code(200);
                        } else {
                            await transaction.rollback();
                            return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', {});
                        }
                    } else {
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
                    }
                }
            }
            else {
                await transaction.rollback();
                if (validateToken) {
                    await validateToken.increment(['verificationsAttempts'], { by: 1 });
                }
                return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN', {});
            }
        } else {
            
            if (validateToken) {
                await validateToken.increment('verificationsAttempts', { by: 1,transaction: transaction });
            }
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN_OR_CODE', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}




export const login = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let { email, password, code } = request.payload;
        let varifificationAttempts = 0;
        const validateAccount = await Models.User.findOne({ where: { email: email }, include: [{ model: Models.UserSetting }] });
        if (validateAccount && validateAccount.password) {
            let passwordVerification = Bcrypt.compareSync(password, validateAccount.password);
            //console.log(passwordVerification && validateAccount.status, Constants.STATUS.ACTIVE);
            if (passwordVerification && validateAccount.status == Constants.STATUS.ACTIVE) {
                let defaultAccount = await Models.UserAccount.findOne({ where: { userId: validateAccount.id, isDefault: true } });
                let getDatafor = +process.env.SAAS_ENABLED! && defaultAccount?.accountId ? defaultAccount?.accountId : null;
                console.log("getDatafor =============>", getDatafor)
                if (+process.env.ENABLE_2FA! && validateAccount.UserSettings?.twoFactorAuthentication) {
                    let tokenType = '2faVerification';
                    let token = Common.signToken({ secret: validateAccount.secret, id: validateAccount.id, accountId: getDatafor, type: tokenType }, tokenType);
                    let saveToken = await Models.Token.upsert({
                        id: validateAccount.id,
                        token: token,
                        status: Constants.STATUS.ACTIVE,
                        type: tokenType,
                        code: code,
                        verificationsAttempts: varifificationAttempts
                    },
                        { fields: ['email', 'type'], transaction: transaction });
                    await transaction.commit();
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("VERIFICATION_TOKEN_GENERATED_SUCCESSFULly")), responseData: { verification: { token: token } } }).code(200)
                } else {
                    console.log("Hello from else =============")
                    const userData = await loginToken(request.headers.timezone, validateAccount.id!, getDatafor!, request.headers.language, transaction, request.headers.permissions);
                    console.log("djhdjkshd **********************", userData)
                    await transaction.commit();
                    const clientIp = requestIp.getClientIp(request);
                    if (userData) {
                        // let emailTemplate = await Email.getByCode('LOGIN_MAIL', request.headers.language);
                        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("LOGIN_SUCCESSFULLY")), responseData: { user: userData } }).code(200);
                    } else {
                        await transaction.rollback();
                        return Common.generateError(request, 500, 'Data Inavalidate', {});
                    }
                }
            } else {
                if (validateAccount.status != Constants.STATUS.ACTIVE) {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'INVALID_SUSPENDED_CONTACT_ADMIN', {});
                } else {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'INVALID_PASSWORD', {});
                }
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_CREDENTIALS', {});
        }
    }
    catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}


// Generate new token using previously shared token and refresh token
export const refreshToken = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let refreshToken = request.payload.refreshToken;
        let tokenData = await Common.validateToken(Common.decodeToken(refreshToken), 'refreshToken');
        if (tokenData && tokenData.isValid) {
            if (request.auth.tokenData.credentials.userData.id) {
                let newUserToken = await loginToken(request.headers.timezone, request.auth.tokenData.credentials.userData.id, request.auth.tokenData.credentials.userData.accountId, request.headers.language, transaction, request.auth.tokenData.credentials.userData.permission);

                if (newUserToken) {
                    await transaction.commit();
                    Common.validSessionToken(request.authtokenData.credentials.userData.id, newUserToken.token);
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("TOKEN_GENERATED_SUCCESSFULLY")), token: newUserToken.token }).code(200)
                }
            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'INEFFICIENT_DATA_TO_REGENERATE_TOKEN', {});
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_TOKEN', {});
        }
    }
    catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// Change password using authentication token and new password
export const changePassword = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        const auth = request.auth.credentials.userData;
        const { oldPassword, newPassword } = request.payload;
        let currentUserPassword = await Models.User.findOne({ where: { id: auth.id } });
        var password: string | null;
        if (currentUserPassword?.password) {
            password = currentUserPassword.password

            let passwordVerification = Bcrypt.compareSync(oldPassword, password);
            if (passwordVerification) {
                const rounds = +process.env.HASH_ROUNDS!;
                const password = Bcrypt.hashSync(newPassword, rounds);
                await Models.User.update({ password: password }, { where: { id: auth.id }, transaction: transaction });
                const clientIp = requestIp.getClientIp(request);
                let userData = request.auth.credentials.userData;
                await transaction.commit();
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PASSWORD_UPDATED_SUCCESSFULLY")) }).code(200)

            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'INVALID_UPDTAE_PASSWORD', {});
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'PASSWORD_NOT_FOUND', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// Change password using user id of the user and new password
export const changeUserPassword = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        const auth = request.auth.credentials.userData;
        const userId = request.payload.userId;
        let accountId = request.auth.credentials.userData.accountId;
        let newPassword = request.payload.password;
        let userData = await Models.User.findOne({ 
            include: [{model: Models.UserAccount, where:{accountId:accountId}}],
            where: { id: userId } 
        });

        let password = "";
        //return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PASSWORD_UPDATED_SUCCESSFULLY"), responseData: JSON.parse(JSON.stringify(userData)) }).code(200)

        if (userData) {
            
            const rounds = +process.env.HASH_ROUNDS!;
            password = Bcrypt.hashSync(newPassword, rounds);
            await Models.User.update({ password: password }, { where: { id: userId}, transaction: transaction });
            const clientIp = requestIp.getClientIp(request);
            let userData = request.auth.credentials.userData;
            Common.revokeSessionToken(userId);
            await transaction.commit();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PASSWORD_UPDATED_SUCCESSFULLY")) }).code(200)
        } else {
            await transaction.rollback();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("USER_NOT_FOUND")) }).code(400)
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// generate a forgot password token using email and reset it using resetPassword endpoint below.
export const forgotPassword = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        const { email } = request.payload;
        let validateUser = await Models.User.findOne({ where: { email: email }, include: [{ model: Models.UserProfile }] });
        if (validateUser) {
            let name = validateUser.UserProfile?.name;
            let tokenType = 'forgotPassword';
            let token = Common.signToken({ email: validateUser.email, id: validateUser.id, type: tokenType }, tokenType);
            let code = Common.generateCode(4, 'number');
            let verificationsAttempts = 0;
            if (process.env.NODE_ENV == 'TEST') {
                code = process.env.MASTER_CODE!;
            }
            let saveToken = await Models.Token.upsert({
                email: email,
                token: token,
                code: code,
                status: Constants.STATUS.ACTIVE,
                type: tokenType,
                verificationsAttempts: verificationsAttempts,
            }, { fields: ['email', 'type'], transaction });
            if (saveToken) {
                // let emailTemplate = await Email.getByCode('FORGOTPASSWORD', request.headers.language);
                await transaction.commit();
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("VERIFICATION_EMAIL_SENT_TO_EMAIL_ID")), responseData: { token: token } }).code(200);
            } else {
                await transaction.rollback();
                return Common.generateError(request, 500, 'ERROR_WHILE_GENERATING_VERIFICATION_TOKEN', Error);
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_REQUEST_UNABLE_TO_FIND_USER', {});
        }

    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const addNewPassword = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        const auth = request.auth.credentials.userData;
        const { newPassword } = request.payload;
        let currentUserData = await Models.User.findOne({ where: { id: auth.id } });
        if (currentUserData) {
            const rounds = +process.env.HASH_ROUNDS!;
            const password = Bcrypt.hashSync(newPassword, rounds);
            await Models.User.update({ password: password }, { where: { id: auth.id }, transaction: transaction });
            const clientIp = requestIp.getClientIp(request);
            let userData = request.auth.credentials.userData;
            await transaction.commit();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PASSWORD_UPDATED_SUCCESSFULLY") )}).code(200)

        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_UPDTAE_PASSWORD', {});
        }
    }
    catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// Reset password using token and code generated from forgot password Request
export const resetPassword = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        const { code, token, password } = request.payload;
        const validateToken = await Models.Token.findOne({ where: { type: 'forgotPassword', token: token, status: Constants.STATUS.ACTIVE, code: code } });
        if (validateToken) {
            const tokenData = await Common.validateToken(Common.decodeToken(token), request.auth.tokenData.credentials.userData.type);
            const userId = request.auth.tokenData.credentials.userData.id;
            const rounds = +process.env.HASH_ROUNDS!;
            const newpassword = Bcrypt.hashSync(password, rounds);
            let updatePassword = await Models.User.update({ password: newpassword }, { where: { id: userId }, transaction: transaction });
            if (tokenData && tokenData?.isValid && updatePassword) {
                let defaultAccount = await Models.UserAccount.findOne({ where: { userId: userId, isDefault: true } });
                if (defaultAccount !== null) {
                    const userData = await loginToken(request.headers.timezone, userId, defaultAccount.accountId, request.headers.language, transaction, request.headers.permissions);
                    const clientIp = requestIp.getClientIp(request);
                    if (userData) {
                        await transaction.commit();
                        //h.state('authorization',userData.token);
                        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("PASSWORD_UPDATED_SUCCESSFULLY")), responseData: userData }).code(200);
                    }
                    else {
                        await transaction.rollback();
                        return Common.generateError(request, 500, 'ERROR_WHILE_RESETTING_PASSWORD', Error);
                    }

                } else {
                    transaction.rollback();
                    return Common.generateError(request, 500, 'ERROR_WHILE_RESETTING_PASSWORD', Error);
                }
            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'INVALID_TOKEN', {});
            }
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', Error);
    }
}




export const create = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;

        let { name, email } = request.payload;
        let validateUser = await Models.User.findOne({ where: { email: email } });
        if (!validateUser) {
            // user does not have account on system. continue with account creation process
            const profile = { name: name };
            const settings = { twoFactorAuthentication: false }
            const rounds = process.env.HASH_ROUNDS ? +process.env.HASH_ROUNDS : '';
            //let password=Common.generateCode(10,'text');
            let password = '123456';
            const userPassword = Bcrypt.hashSync(password, rounds);
            const newUser = await Models.User.create({ email: email, mobile: '', password: userPassword, status: Constants.STATUS.ACTIVE, UserProfile: profile, UserSettings: settings }, { include: [{ model: Models.UserProfile }, { model: Models.UserSetting }], transaction: transaction });
            if (newUser) {
                await Models.UserAccount.create({ accountId: accountId, userId: newUser.id, isDefault: true }, { transaction: transaction });
                const userRole = await Models.Role.findOne({ where: { code: process.env.DEFAULT_USER_ROLE }, transaction: transaction });
                
                if(userRole && userRole.id){
                    await newUser.setRoles([userRole.id], { transaction: transaction })
                    transaction.commit();
                    // send email to user with passoword
                    return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("USER_CREATED_SUCCESSFULLY")) }).code(200)
                }else {
                    await transaction.rollback();
                    return Common.generateError(request, 400, 'SYSTEM_HAS_NOT_BEEN_INITIALZED_WITH_DEFAULT_ROLES', {});
                }
                

            } else {
                transaction.rollback();
                return Common.generateError(request, 500, 'ERROR_WHILE_CREATING_USER', Error);
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'USER_ALREADY_EXISTS', {});
        }
    } catch (err) {
        transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const setUserSetting = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let fields = request.payload;
        let userId = request.auth.credentials.userData.id;
        let updateSettings = await Models.UserSetting.update(fields, { where: { userId: userId }, transaction: transaction });
        if (updateSettings) {
            let userSetting = await Models.UserSetting.findAll({ attributes: ["twoFactorAuthentication", "skipSubscriptionPage", "skipDashboardTour"], where: { userId: userId } });
            await transaction.commit();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")), responseData: userSetting }).code(200)
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'REQUEST_PROCESSED_UNSUCCESSFULLY', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const getUserSetting = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let userId = request.auth.credentials.userData.id;
        let settings = await Models.UserSetting.findAll({ attributes: ["twoFactorAuthentication", "skipSubscriptionPage"], where: { userId: userId } });
        if (settings) {
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")), responseData: settings }).code(200)
        } else {
            return Common.generateError(request, 400, 'ERROR_WHILE_GETTING_USER_SETTINGS', {});
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const changeEmail = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        let countryCode = request.auth.credentials.userData.countryCode || null;
        let mobile = request.auth.credentials.userData.mobile || null;
        let verificationsAttempts = request.auth.credentials.userData.verificationsAttempts || null;

        let { email } = request.payload;
        let existingAccount = await Models.User.findOne({ where: { email: email } });
        if (!existingAccount) {
            let currentProfile = await Models.UserProfile.findOne({ where: { userId: userId } });
            let name = currentProfile?.name;
            let tokenType = 'changeEmail';
            let token = Common.signToken({ email: email, id: userId, type: tokenType }, tokenType);
            let code = Common.generateCode(4, 'number');
            if (process.env.NODE_ENV == 'TEST') {
                code = process.env.MASTER_CODE!;
            }
            let saveToken = await Models.Token.upsert({
                email: email,
                accountId: accountId,
                token: token,
                code: code,
                status: Constants.STATUS.ACTIVE,
                type: tokenType,
                countryCode: countryCode,
                mobile: mobile,
                userId: userId,
                verificationsAttempts: verificationsAttempts
            }, { fields: ['email', 'type'], transaction: transaction });
            if (saveToken) {
                // let emailTemplate = await Email.getByCode('CHANGE_EMAIL', request.headers.language);
              
                await transaction.commit();
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("VERIFICATION_EMAIL_SENT_TO_EMAIL_ID")), responseData: { token: token } }).code(200);
            } else {
                await transaction.rollback();
                return Common.generateError(request, 500, 'ERROR_WHILE_GENERATING_VERIFICATION_TOKEN', Error);
            }
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'EMAIL_ID_ALREADY_IN_USE', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const verifyChangeEmail = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {

        let { token, code } = request.payload;
        let tokenType = 'changeEmail';
        let validateToken = await Models.Token.findOne({ where: { token: token, type: tokenType, status: Constants.STATUS.ACTIVE } });
        let InvalidAttempts = process.env.INVALID_ATTEMPTS ? +process.env.INVALID_ATTEMPTS : 0;
        if (validateToken && validateToken.verificationsAttempts < InvalidAttempts && code == validateToken.code) {
            await validateToken.increment('verificationsAttempts', { by: 1, transaction: transaction });
            let tokenData = await Common.validateToken(Common.decodeToken(token), tokenType);
            let requiredKeys = ["email", "id"];
            let validateKeys = Common.validateKeys(request.auth.tokenData?.credentials.userData, requiredKeys);
            if (tokenData && tokenData?.isValid && validateKeys) {
                await validateToken.update({ status: Constants.STATUS.INACTIVE }, { transaction: transaction });
                const { email, id, accountId } = request.auth.tokenData.credentials.userData;
                await Models.User.update({ email: email }, { where: { id: id }, transaction: transaction });
                const userData = await loginToken(request.headers.timezone, id, null, request.headers.language, transaction, request.headers.permission);
                await transaction.commit();
                const clientIp = requestIp.getClientIp(request);
                // await Common.logActivity('UPDATED_EMAIL', { name: request.auth.credentials.userData.name, ip: clientIp }, request.auth.credentials.userData.id, request.auth.credentials.userData.accountId, clientIp, null)
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("ACCOUNT_EMAIL_UPDATED_SUCCESSFULLY")), responseData: userData }).code(200);
            } else {
                await transaction.rollback();
                if (validateToken) {
                    await validateToken.increment(["verificationsAttempts"], { by: 1 });
                }
                return Common.generateError(request, 400, 'INVALID_TOKEN', {});
            }
        } else {
            await transaction.rollback();
            if (validateToken) {
                await validateToken.increment('verificationsAttempts', { by: 1 });
            }
            return Common.generateError(request, 400, 'INVALID_OR_EXPIRED_TOKEN_OR_CODE', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const changeMobile = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {

    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const updateProfileImage = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let { imageId } = request.payload;
        let validateImage = await Models.Attachment.findOne({ where: { id: imageId, status: Constants.STATUS.INACTIVE } })
        if (validateImage) {
            let userData = { imageId: imageId };
            let profileUpdate = await Models.UserProfile.update(userData, { where: { id: userId }, transaction: transaction });
            let updateAttachmentStatus = await Models.Attachment.update({ status: Constants.STATUS.ACTIVE }, { where: { id: imageId }, transaction: transaction });
            let updatedImage = await Models.UserProfile.findOne(
                {
                    where: { userId: userId },
                    attributes: [[Sequelize.fn('CONCAT', process.env.PROTOCOL, '://', process.env.SERVER_HOST, "/attachment/", Sequelize.literal('`profileImage`.`unique_name`')), 'profileImage']],
                    include: [{ model: Models.Attachment, as: 'profileImage' }], transaction: transaction
                }
            );
            updatedImage = JSON.parse(JSON.stringify(updatedImage))

            if (profileUpdate) {
                transaction.commit();
                const clientIp = requestIp.getClientIp(request);
                // await Common.logActivity('UPDATED_PROFILE_IMAGE', { name: request.auth.credentials.userData.name, ip: clientIp }, request.auth.credentials.userData.id, request.auth.credentials.userData.accountId, clientIp, null)
                let Img = null;
                return h.response({
                    message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")), responseData: {

                        profileImage: updatedImage?.imageId

                    }
                }).code(200);
            } else {
                transaction.rollback();
                return Common.generateError(request, 400, 'ERROR_WHILE_UPDATING_PROFILE_IMAGE', {});
            }
        } else {
            transaction.rollback();
            return Common.generateError(request, 400, 'ERROR_WHILE_VALIDATING_ATTACHMENT', {});
        }
    } catch (err) {
        transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const updateProfile = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let accountId = request.auth.credentials.userData.accountId;
        let userId = request.auth.credentials.userData.id;
        let email=  request.payload.email;
        let emailFlag = 0;
        let data = {
            name: request.payload.name,
            // userId :userId,
            imageId: request.payload.imageId,
            gender: request.payload.gender,
            address1 : request.payload.address1,
            address2 : request.payload.address2,
            address3 : request.payload.address3,
            pin : request.payload.pin,
            stateId : request.payload.stateId,
            stateName : request.payload.stateName,
            occupation:request.payload.occupation
            // password : request.payload.password,

        }

        console.log("==================Email--->",data)
        if( email === '' ){
            console.log("===Hello world=====Email--->",data)
        }

        let isUserExist = await Models.User.findOne({ where: { id: userId } });
        
        if( isUserExist ){
            if (email !== undefined) { 
                if (email === "") { 
                    await Models.User.update({ email: null }, { where: { id: userId }, transaction: transaction });
                } else {
                    let validateUser = await Models.User.findOne({ where: { email: email } });
                    if (validateUser && validateUser.id !== userId) {
                        await transaction.rollback();
                        return Common.generateError(request, 400, 'EMAIL_ID_ALREADY_REGISTERED', {});
                    } else {
                        await Models.User.update({ email: email }, { where: { id: userId }, transaction: transaction });
                        emailFlag = 1
                    }
                }
            }
            if( data?.imageId ){
               await Models.User.update({imageId: data?.imageId}, { where: { id: userId }, transaction: transaction });
             
            }
            let newObject  = await removeUndefinedFields(data)
            console.log("newObject",newObject,userId)
            const updatedp = await Models.UserProfile.update(newObject, { where: { userId: userId }, transaction: transaction });
            console.log("profile updated $$$$$$",updatedp)
            await transaction.commit();
           
            let whereClause: WhereOptions = {
                id: userId
            };

            let profileImage = await Models.User.findOne({ where: whereClause });
            let searchImageId = null;
            if (profileImage && profileImage.imageId) {
                searchImageId = profileImage.imageId;
            }
            let updataUserData = await Models.User.findOne(
                { 
                    where: { id: userId },
                    include: [
                        { 
                            model: Models.UserProfile, as: 'UserProfile' 
                        },
                        {
                            attributes: [
                                "id", "extension", "filePath", "type", "uniqueName",
                                [sequelize.fn('CONCAT', process.env.FILE_PATH,  sequelize.literal('`Attachment`.`unique_name`')), 'filePath']
                            ],
                            required: false,
                            model: Models.Attachment,
                            as : 'Attachment',
                            // where: { id: sequelize.col('User.imageId'), userId: userId },
                            where: { id: searchImageId, userId: userId }
                        }
                    ], 
                }
            );
            updataUserData = JSON.parse(JSON.stringify(updataUserData))
         
            
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("UPDATED_PROFILE_SUCCESSFULLY")), responseData: { user: updataUserData } }).code(200);

        } else {
            await transaction.rollback();
            return Common.generateError(request, 500, 'USER_NOT_FOUND', {});
        }


        // if (password) {
        //     const rounds = +process.env.HASH_ROUNDS!;
        //     password = Bcrypt.hashSync(password, rounds);
        //     await Models.User.update({ password: password }, { where: { id: userId } });
        // }


    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const createProfile = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {  
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        let email=  request.payload.email;
        let emailFlag = 0
        let data = {
            name: request.payload.name,
            userId :userId,
            imageId: request.payload.imageId,
            gender: request.payload.gender,
            address1 : request.payload.address1,
            address2 : request.payload.address2,
            address3 : request.payload.address3,
            pin : request.payload.pin,
            stateId : request.payload.stateId,
            occupation:request.payload.occupation
            // password : request.payload.password,

        }
        // let { name, imageId, email, gender, password } = request.payload;
        // let attachment;
        // let userData = { name: name, imageId: imageId, email: email, gender: gender };

        let validateUser = await Models.User.findOne({ where: { id:userId } });
        validateUser = JSON.parse(JSON.stringify(validateUser))
        if (validateUser && email && email != '' && validateUser.email != email) {
            let findExistingEmail = await Models.User.findOne({where:{email:email}})
            if(findExistingEmail){
            await transaction.rollback();
            return Common.generateError(request, 500, 'EMAIL_ID_ALREADY_REGISTERED', {});
            }

        }

        let user = await Models.UserProfile.findOne({ where: { userId: userId } });
        if (user) {
            await transaction.rollback();
            return Common.generateError(request, 500, 'USER_ALREADY_EXIST', {});
        }

        // if (data?.password) {
        //     const rounds = +process.env.HASH_ROUNDS!;
        //     let passcode = Bcrypt.hashSync(data?.password, rounds);
        //     await Models.User.update({ password: passcode }, { where: { id: userId } });
        // }

        let newData = await removeUndefinedFields(data)

        let profileUpdate = await Models.UserProfile.create(newData,{transaction});
        if (data?.imageId || email) {
            let updateObject = {}
            if(data?.imageId){
                updateObject = {...updateObject, imageId: data?.imageId}
            }
            if(email && email != ""){
                updateObject = {...updateObject,email:email}
                emailFlag = 1
            }
            await Models.User.update(updateObject, { where: { id: userId },transaction });
            // await Models.Attachment.update({ userId: userId }, { where: { id: imageId } });
        }

        let createdUser = await Models.User.findOne({
            include: [
                {
                    attributes: [
                        "name", "gender", "stateId", "pin", "address1", "address2", "address3","occupation",
                        [sequelize.fn('CONCAT', process.env.FILE_PATH, sequelize.literal('`UserProfile->profileImage`.`unique_name`')), 'profile_Image']
                    ],
                    model: Models.UserProfile,
                    include: [
                    { 
                        model: Models.Attachment, 
                        as: 'profileImage',
                        attributes: [] 
                    },
                  ]
                }
            ],
            where: { id: userId },
            subQuery: false,
            transaction: transaction
        });

        if(profileUpdate ){
            await transaction.commit();
           
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")), responseData: { user: createdUser } }).code(200);
        }
        
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}






export const resendEmailVerificationCode = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let tokenType = ['signup', 'changeEmail', 'reset2fa'];
        let { token } = request.payload;
        let validateToken = await Models.Token.findOne({ where: { token: token, type: tokenType, status: Constants.STATUS.ACTIVE } });
        if (validateToken) {
            let tokenData = await Common.validateToken(Common.decodeToken(token), tokenType);
            let code = Common.generateCode(4, 'number');
            let updateToken = await Models.Token.update({ code: code }, { where: { id: validateToken.id }, transaction: transaction });
            await transaction.commit();
       
         
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")) }).code(200);
        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'INVALID_TOKEN', {});
        }

    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}


export const getUser = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    const transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        if(request.params.id){
            userId = request.params.id;
        }
        let userData = await loginToken(request.headers.timezone, userId, accountId, request.headers.language, transaction, request.headers.permission);
        transaction.commit();
        if (userData) {
            delete userData.token;
            delete userData.refreshToken;
        }
        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")), responseData: userData }).code(200);
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const updateUserStatus = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let accountId = request.auth.credentials.userData.accountId;
        let userId = request.auth.credentials.userData.id;

        //check if this is admin or sime other usertype

        let roles = await Common.getUserRoles(accountId);
        let rolesUser = await Common.getUserRoles(userId);
        let where = {};
        if(roles && roles.length > 0 && (roles.indexOf('admin') != -1)){
            if(rolesUser && rolesUser.length > 0 && (rolesUser.indexOf('rider') != -1)){
                where = {accountId: accountId}
            }
        }else{
            where = {accountId: accountId}
        }
        let { id } = request.params;
        let { status } = request.payload;
        let validateUser = await Models.User.findOne({
                include: [
                    {
                        required: true,
                        model: Models.UserAccount,
                        as: "userAccounts",
                        where: where
                    }
                    
                ],
                where: { id: id } 
            });
            //return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY"), responseData: JSON.parse(JSON.stringify(validateUser)) }).code(200);
        if (validateUser) {
            await Models.User.update({ status: status }, { where: { id: id }, transaction });
            await transaction.commit();
            if (status == false) {
                Common.revokeSessionToken('user_' + id);
            }
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")) }).code(200);
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}



export const updateFcmToken = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let { fcmToken } = request.payload;
        let validateUser = await Models.User.findOne({ where: { id: userId } });
        if (validateUser) {
            await Models.User.update({ fcmToken: fcmToken }, { where: { id: validateUser.id }, transaction });
            await transaction.commit();
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("REQUEST_PROCESSED_SUCCESSFULLY")) }).code(200);

        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'USER_NOT_FOUND', {});
        }


    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

export const logout = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    let transaction = await sequelize.transaction();
    try {
        let userId = request.auth.credentials.userData.id;
        let validateUser = await Models.User.findOne({ where: { id: userId } });
        
        if (validateUser) {
            
            Common.revokeSessionToken('user_' + userId);
            let fcmTokenDelete = await Models.User.update({ fcmToken: null }, { where: { id: userId }, transaction });
            let tokenFind = await Models.Token.findOne({ where: { mobile: request.auth.credentials.userData.mobile } })
            if (tokenFind) {
                await Models.Token.destroy({ where: { mobile: request.auth.credentials.userData.mobile }, transaction });
            }


            if (fcmTokenDelete) {
                await transaction.commit();
                return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("LOGGED_OUT_SUCCESSFULLY") )}).code(200);
            } else {
                await transaction.rollback();
                return Common.generateError(request, 400, 'TOKEN_NOT_FOUND_OR_ALREADY_LOGGED_OUT', {});
            }

        } else {
            await transaction.rollback();
            return Common.generateError(request, 400, 'USER_NOT_FOUND', {});
        }
    } catch (err) {
        await transaction.rollback();
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}









