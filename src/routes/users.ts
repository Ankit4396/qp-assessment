//import hapiAuthJwt2 from "hapi-auth-jwt2";
import  {Common,Joi} from "../config/routeImporter";
import * as Users from "../controllers/users";
import {RouteType} from '../config/interfaces'
import * as Boom from '@hapi/boom';
import { Models, sequelize } from "../models";
import { Sequelize, Op } from "../config/dbImporter";
import {
    signup,
    signupResponse,
    validateToken,
    validateTokenResponse,
    twoFactorQrResponse,
    verifyEmail,
    verifyEmailResponse,
    login,
    loginResponse,
    validate2FACode,
    changePasswordRequest,
    changeUserPasswordRequest,
    successOnlyResponse,
    refreshTokenRequest,
    createProfile,
    forgetPasswordRequest,
    forgotPasswordRequest,
    forgotPasswordResponse,
    resetPasseordRequest,
    resetPasseordResponse,
    loginWithMobileRequest,
    loginWithMobileResponse,
    verifyOTPRequest,
    resendOTPRequest,
    reset2FAAuthRequest,
    reset2FAAuthResponse,
    validateReset2FARequest,
    validateReset2FAResponse,
    newAccountRequest,
    newAccountResponse,
    userSettings,
    statsResponse,
    updateProfile,
    updateProfileImage,
    updateProfileImageResponse,
    changeEmailRequest,
    changeEmailResponse,
    resendEmailVerificationCodeRequest,
    resendEmailVerificationCodeResponse,
    userIdentifier,
    updateUserStatus,
    updateUserStatusResponse,
    loginWithMobileAndPasswordRequest,
    updateFcmToken,
    updateFcmTokenResponse,
    getUserLogoutResponse,
    createStaffRequest,
    updateStaffRequest,
    listUserRequest,
    getStatesbyPhoneCode,
    listUserWithoutPaginateRequest,
    listUserByRoleRequest,
    verifyOTPQuery
    
} from "../validators/users"



const {authorizedheaders,optional_authorizedheaders,headers,options,validator,respmessage,resp400,resp500,identifier}=require("../validators/global")

const routes: RouteType[] =[ 
   
  
    {
        method: 'POST',
        path: '/verifyEmail',
        handler:Users.verifyEmail,
        options:{
            tags: ["api", "User"],
            notes: "Verify email with token and code, if validated it will give you login data object, after 5 attempts token will stand invalid",
            description: "Verify Email ID",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                payload:verifyEmail,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200:verifyEmailResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/login',
        handler:Users.login,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Authenticate user with possible authentication methods",
            description: "User Authentication",
            auth: false,
            validate: {
                headers: headers,
                options: {
                    abortEarly: false
                },
                payload:login,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: loginResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/mobileLogin',
        handler:Users.mobileLogin,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Authenticate user with mobile and OTP. If mobile hasn't been registered, account would be created after number verification using OTP",
            description: "User Authentication with mobile and OTP",
            auth: false,
            validate: {
                headers: optional_authorizedheaders,
                options: {
                    abortEarly: false
                },
                payload:loginWithMobileRequest,
                query: verifyOTPQuery, 
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: loginWithMobileResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/mobileNumberUpdate',
        handler:Users.mobileNumberUpdate,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Input updated Mobile Number to receive OTP ",
            description: "Update Mobile Number request",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options: options,
                payload:loginWithMobileRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: loginWithMobileResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/verifyOTP',
        handler:Users.verifyOTP,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Verify mobile and OTP",
            description: "Verify mobile",
            auth: { strategies: ['session','jwt'],mode:'optional'},
            validate: {
                headers: optional_authorizedheaders,
                options: options,
                payload:verifyOTPRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: loginResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/resendOTP',
        handler:Users.resendOTP,
        options:{
            tags: ["api", "User"],
            notes: "Create a new user account for the service",
            description: "Create new account",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                payload: resendOTPRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    200: successOnlyResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    // {
    //     method: 'POST',
    //     path: '/socialLogin',
    //     handler:Users.socialLogin,
    //     options:{
    //         tags: [
    //             "api", "User"
    //         ],
    //         notes: "Authenticate user with apple and google",
    //         description: "User Authentication with social network",
    //         auth: false,
    //         validate: {
    //             headers:headers,
    //             options: options,
    //             payload:socialLogin,
    //             failAction: async (req:any, h:any, err:any) => {
    //                 return Common.FailureError(err, req);
    //             },
    //             validator: Joi
    //         },
    //         response: {
    //             status: {
    //                 200: loginResponse,
    //                 400: resp400,
    //                 500: resp500
    //             }
    //         }
    //     }
    // },
    {
        method: 'POST',
        path: '/refreshToken',
        handler:Users.refreshToken,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Generate new ",
            description: "Refresh authenticatio",
            auth: false,
            validate: {
                headers: headers,
                options: options,
                payload:refreshTokenRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    //200: refreshTokenResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },

    {
        method: 'PATCH',
        path: '/user/addNewPassword',
        handler:Users.addNewPassword,
        options:{
            tags: ["api", "User"],
            notes: "Generate a forgot password request",
            description: "Forgot Password",
            auth: { strategies: ['session','jwt'], scope: ['user','admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload:forgetPasswordRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: successOnlyResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },



    {
        method: 'PATCH',
        path: '/user/changePassword',
        handler:Users.changePassword,
        options:{
            tags: ["api", "User"],
            notes: "Update user password",
            description: "Update Password",
            auth: { strategies: ['session','jwt'], scope: ['user','admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload:changePasswordRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: successOnlyResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'PATCH',
        path: '/user/changeUserPassword',
        handler:Users.changeUserPassword,
        options:{
            tags: ["api", "User"],
            notes: "Update user password",
            description: "Update Password",
            auth: { strategies: ['session','jwt'], scope: ['user','admin'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload:changeUserPasswordRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    //200: successOnlyResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/forgotPassword',
        handler:Users.forgotPassword,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Generate a forgot password request",
            description: "Forgot Password",
            auth: false,
            validate: {
                headers:headers,
                options:options,
                payload:forgotPasswordRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: forgotPasswordResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/resetPassword',
        handler:Users.resetPassword,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Reset password from forgot password flow",
            description: "Reset Password",
            auth: false,
            validate: {
                headers:headers,
                options:options,
                payload:resetPasseordRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: resetPasseordResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    
    
    
    
    {
        method: 'POST',
        path: '/user/create',
        handler:Users.create,
        options:{
            tags: ["api", "User"],
            notes: "Create user from admin panel",
            description: "Create User from admin panel",
            auth: { strategies: ['session','jwt'], scope: ['admin','user','create_account'] },
            validate: {
                headers: authorizedheaders,
                options: options,
                payload: newAccountRequest,
                failAction: async (req:any, h:any, err:any) => {
                    return Common.FailureError(err, req);
                },
                validator: validator
            },
            response: {
                status: {
                    200: newAccountResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    }, 
    {
        method: 'POST',
        path: '/user/createProfile',
        handler:Users.createProfile,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Create user profile",
            description: "create user profile",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload: createProfile,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: updateProfileResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },

    {
        method: 'PATCH',
        path: '/user/updateProfile',
        handler:Users.updateProfile,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Update user profile",
            description: "Update user profile",
            auth: { strategies: ['session','jwt'], scope: ['admin','manage_users', 'user']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload:updateProfile,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: updateProfileResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },
    
    
    {
        method: 'PATCH',
        path: '/user/updateProfileImage',
        handler:Users.updateProfileImage,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Update user profile image",
            description: "Update user profile image",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload:updateProfileImage,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: updateProfileImageResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },
    {
        method: 'POST',
        path: '/user/changeEmail',
        handler:Users.changeEmail,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Change user email",
            description: "Change user email",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload:changeEmailRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: changeEmailResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },
    {
        method: 'PATCH',
        path: '/user/verifyChangeEmail',
        handler:Users.verifyChangeEmail,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Verify change email request",
            description: "Verify change email request",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload:verifyEmail,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: verifyEmailResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },
    {
        method: 'PATCH',
        path: '/user/resendEmailVerificationCode',
        handler:Users.resendEmailVerificationCode,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Resend email verification code",
            description: "Resend email verification code",
            auth: false,
            validate: {
                headers:headers,
                options:options,
                payload:resendEmailVerificationCodeRequest,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: resendEmailVerificationCodeResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },

    {
        method: 'PATCH',
        path: '/user/status/{id}',
        handler:Users.updateUserStatus,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Update status of user",
            description: "Update user status",
            auth: { strategies: ['session','jwt'], scope: ['admin', 'individualRole','organisationRole'] },
            validate: {
                headers:authorizedheaders,
                options:options,
                params:userIdentifier,
                payload:updateUserStatus,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: updateUserStatusResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/user/{id}',
        handler:Users.getUser,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Get User data",
            description: "Get User Data",
            auth: { strategies: ['session','jwt'], scope: ['admin','manage_users'] },
            // auth : false,
            validate: {
                headers:authorizedheaders,
                options:options,
                params:userIdentifier,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: getUserResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/user/profile',
        handler:Users.getUser,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Get User data",
            description: "Get User Data",
            auth: { strategies: ['session','jwt'], scope: ['admin','manage_users', 'user'] },
            validate: {
                headers:authorizedheaders,
                options:options,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    // 200: getUserResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
    {
        method: 'PATCH',
        path: '/user/updateFcmToken',
        handler:Users.updateFcmToken,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Update user FCM token",
            description: "Update user FCM token",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                payload:updateFcmToken,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: updateFcmTokenResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }

    },
    {
        method: 'POST',
        path: '/user/logout',
        handler:Users.logout,
        options:{
            tags: [
                "api", "User"
            ],
            notes: "Get User Logout",
            description: "Logout user",
            auth: { strategies: ['session','jwt']},
            validate: {
                headers:authorizedheaders,
                options:options,
                failAction: async (request:any, h:any, err:any) => {
                    return Common.FailureError(err, request);
                },
                validator: Joi
            },
            response: {
                status: {
                    200: getUserLogoutResponse,
                    400: resp400,
                    500: resp500
                }
            }
        }
    },
]

module.exports = routes;