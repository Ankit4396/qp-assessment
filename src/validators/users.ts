
import {Joi,Common,_} from "../config/routeImporter";


const getStatesbyPhoneCode = Joi.object().keys({
    phoneCode:Joi.string().required().description("Phone code"),
}).label('getStatesbyPhoneCode').description("Get states by phone code");

const login2FAVerification:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().example("valid jwt token")
}).label('login-verification-data').description("Token to verify")

const CategoryDetails:  Joi.ObjectSchema = Joi.object().keys({
    id: Joi.number().example(1).description("Unique identifier for the user's attachment"),
    name:Joi.string().trim().example("businessCategory").description("Name of Business Category"),
    code:Joi.string().example("businessCategory-code").description("Name of Business Category code"),
}).label('business-category-details').description("Business-category-info").allow(null).optional();

const driverOnlineStatusRequest:  Joi.ObjectSchema = Joi.object().keys({
    onlineStatus:Joi.number().valid(0, 1).description("Online status of the rider"),
    location: Joi.object().keys({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }).required().description("Location of the user")
}).label('online-status-rider').description("online-status-rider").allow(null).optional();

const user:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the user"),
    accountId:Joi.number().allow(null).example(1).description("User's Account identifier"),
    email:Joi.string().trim().email().allow(null).example("email@domain.com").description("User's email id"),
    countryCode:Joi.string().trim().example("+91").description("User's mobile number country code"),
    mobile:Joi.string().trim().optional().allow(null).example("+xxxxxxxxxx").description("User's mobile no"),
    token:Joi.string().trim().example("valid-jwt-token").description("User's authorization token"),
    refreshToken:Joi.string().trim().example("valid-jwt-token").description("Refresh token"),
    expiryDate:Joi.date().example("2023-01-02T12:18:55.000Z").description("Expiry date").allow(null),
    status:Joi.number().example(1).valid(0,1).description("Activation status"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("Creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("Last update date"),
    UserProfile:Joi.object().keys({
        name:Joi.string().example("Administrator").description("User's display name"),
        address:Joi.string().allow(null).example("address").description("User's display name"),
        city:Joi.string().allow(null).example("city").description("User's display name"),
        gender:Joi.string().allow(null).example("gender").description("User's gender"),
        state:Joi.string().allow(null).example("state").description("User's display name"),
        country:Joi.string().allow(null).example("country").description("User's display name"),
        zipCode:Joi.string().allow(null).example("zipCode").description("User's display name"),
        profileImage:Joi.string().allow(null).example("http://host.com/image.jpg").description("User's profile image")
    }).label('user-profile').description('user-profile-data').allow(null),
    UserBusinessProfile:Joi.object().keys({
    businessCategory:Joi.number().allow(null).example("1").description("User's business Category Number"),
    avgDailyOrders:Joi.number().allow(null).example("address").description("User's Business avg DailyOrders display name"),
    companyName:Joi.string().allow(null).trim().example("city").description("User's display name"),
    companyEmailAddress:Joi.string().trim().allow(null).email().example("gender").description("User's gender"),
    companyWebsite:Joi.string().trim().allow(null).example("state").description("User's display name"),
    categoryDetails: CategoryDetails
    }).label('user-profile').description('user-profile-data').allow(null),
    Roles:Joi.array().items(Joi.object().keys({
        code:Joi.string().example("role-code").description("Unique role code"),
        status:Joi.number().example(1).description("Active/inactive status of role, 1=> Active, 0=> Inactive"),
        name:Joi.string().trim().example("Administrator").description("Title assigned to the role"),
        Permissions:Joi.array().items().optional().min(0).description("List of permission assigned to the role")
    }).label('user-role')).description("List of roles assigned to the user along with permissions"),
    UserSubscription:Joi.object().keys({
        status:Joi.number().example(1).description("Status of subscription"),
        planId:Joi.number().example(1).description("Subscription plan identifier"),
        planName:Joi.string().optional().allow(null),
        subscriptionId:Joi.string().example("subscriptionId").description("Subscription identifier")
    }).label('user-subscription').description("User subscripton data").allow(null),
    UserSettings:Joi.object().keys({
        twoFactorAuthentication:Joi.boolean().example(true).description("Two factor authentication enabled"),
        skipSubscriptionPage:Joi.boolean().example(true).description("Skipped subscription page"),
        skipDashboardTour:Joi.boolean().example(true).description("Skipped dashboard tour page"),
        hasUniversalNominee:Joi.boolean().example(true).description("User has universal nominee"),
        kycStatus:Joi.boolean().example(true).description("KYC status")
    }).label('user-subscription').description("User subscripton data").allow(null),
    Attachment:Joi.object().keys({
        id: Joi.number().example(1).description("Unique identifier for the user's attachment"),
        filePath:Joi.string().allow(null).example("/filepath").description("attachemnt file path"),
        extension:Joi.string().allow(null).example(".png").description("attachment extension"),
        type:Joi.number().allow(null).example("1 or 2 (1=>Stored in file system, 2=>Stored on S3 bucket)").description("attachment type")
    }).label('attachment').description("User Attachment data").allow(null)
}).label("user").description('User object, token and refreshToken fields may or may not be part of response depending on request type')

const signup:  Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}).example("Your name"),
    email:Joi.string().trim().email().required().error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED_AND_MUST_BE_VALID_EMAIL_ID')}).example("email@domain.com").description('Valid email id, valid for type email-password'),
    password:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}).example("password").description('Password to validate the account'),
}).label('signup-request').description('Signup request object')

const signupResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('Request processed successfully').description('Confirmation message from server'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('Signup token').description('Response will return a token, account will be created after verification of email or mobile no')
    }).label('signup-token').description('Signup token object')
}).label('signup-response').description('Signup response')

const loginWithMobileRequest:  Joi.ObjectSchema = Joi.object().keys({
    countryCode:Joi.string().pattern(/^[+0-9]+$/).required().error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}).example("+91").description("Country Code"),
    // mobile:Joi.number().required().error(errors=>{return Common.routeError(errors,'MOBILE_NO_IS_REQUIRED')}).example(9999999999).description("Mobile no is required")
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required().error(errors => { return Common.routeError(errors, 'MOBILE_NO_IS_REQUIRED') }).example("9999999999").description("Mobile number must be exactly 10 digits")
}
).label('login-with-mobile-otp').description("Login using mobile and OTP")

const loginWithMobileResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('Request processed successfully').description('Confirmation message from server'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('Mobile OTP token').description('Response will return a token, account will be created after verification of mobile with OTP'),
        isUserExist:Joi.boolean().example(true).description("User already exists")
    }).label('mobile-otp-token').description('Mobile otp token object')
}).label('mobile-login-response').description('Moile login response')

const loginWithMobileAndPasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    countryCode:Joi.string().pattern(/^[+0-9]+$/).required().error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}).example("+91").description("Country Code"),
    mobile:Joi.number().required().error(errors=>{return Common.routeError(errors,'MOBILE_NO_IS_REQUIRED')}).example("9999999999").description("Mobile_NUMBER_IS_REQUIRED"),
    password:Joi.string().trim().required().example('password').description("User's password").error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED_FOR_LOGIN')}),
    fcmToken:Joi.string().trim().example('FCM token').description('FCM Token for notification').optional()
}
).label('login-with-mobile-password').description("Login using mobile and Password")

const loginWithMobileAndPasswordResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().trim().example("login successfull").description('Success message from server'),
    responseData:Joi.object().keys({
        verification:login2FAVerification,
        user:user,
        newSocialAccount:Joi.boolean().optional().allow(null).example(true).description("If social login ends with new account")
    }).or('verification','user').label('login-response-options').description('Can have one of the described options')
}).label('mobile-password-login-response').description('Moile-Password login response')

const verifyOTPRequest:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().required().example("jwt-token").error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('Valid token generated by system from login with mobile request'),
    code:Joi.string().trim().required().example("XXXX").error(errors=>{return Common.routeError(errors,'CODE_IS_REQUIRED')}).description('Code sent to you on your mobile'),
    fcmToken:Joi.string().trim().example('FCM token').description('FCM Token for notification').optional()
}).label('verify-mobile-otp').description("Login using mobile and OTP")

const verifyOTPQuery = Joi.object().keys({
    signUpSource : Joi.number().valid(1,2).example("web").description('signUpSource 1 for web and 2 for mobile').optional(),
}).label('verify-mobile-otp').description("Login using mobile and OTP")

const resendOTPRequest:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().required().example("jwt-token").error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('Valid token generated by system from login with mobile request'),
    type:Joi.string().optional().valid('text','voice').default('text')
}).label('verify-mobile-otp').description("Login using mobile and OTP")

const userObject = user.keys({token:Joi.forbidden(),refreshToken:Joi.forbidden(),Roles:Joi.forbidden()}).label("userObject");

const validateToken:  Joi.ObjectSchema = Joi.object().keys({
    type: Joi.string().trim().example("signup").valid("signup","forgotPassword").default('signup').description('Validate token for?'),
    token:Joi.string().required().trim().example("valid-jwt-token").error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description("token value to be validated")
}).label('validate-token-request')

const validateTokenResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('Token validated successfully').description('success or error message for validation request')
}).label('validate-token-response').description('validate token generated for signup or forgot password process')

const verifyEmail:  Joi.ObjectSchema = Joi.object().keys({
    type: Joi.string().trim().optional().valid('signup','resetPassword','forgotPassword','changeEmail').default('signup').example("signup").description('Type of process for which token is to be generated (signup,resetPassword,forgotPassword,changeEmail)'),
    token:Joi.string().trim().required().example("jwt-token").error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('Valid jwt token generated by system from request made'),
    code:Joi.string().trim().required().example("XXXX").error(errors=>{return Common.routeError(errors,'CODE_IS_REQUIRED')}).description('Code sent to you on email')
}).label('verify-email').description('Verify email using request token and verification code')

const verifyEmailResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('success or error message form system'),
    responseData:user
}).label('verify-email-response').description('validate email and generate login token')

const filters:  Joi.ObjectSchema = Joi.object().keys({
    "searchText":Joi.string().trim().optional().allow(null).description("Search Text")
}).label('user-filters').description("filters to be applied on user listing")

const listUsers:  Joi.ObjectSchema = Joi.object().keys({
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    listType:Joi.string().optional().valid('admin','user','rider','individualRole','organisationRole').default('customer').allow(null),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(+process.env.PAGINATION_LIMIT!).description("number of records per page")
}).label('list-users-request').description("Response object for user list request")

const listIndividualUsers:  Joi.ObjectSchema = Joi.object().keys({
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(+process.env.PAGINATION_LIMIT!).description("number of records per page")
}).label('list-users-request').description("Response object for user list request")


const listBusinessUsers:  Joi.ObjectSchema = Joi.object().keys({
    searchText:Joi.string().trim().optional().allow(null).description("Search Text"),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(+process.env.PAGINATION_LIMIT!).description("number of records per page")
}).label('list-users-request').description("Response object for user list request")

const riderlistUsers: Joi.ObjectSchema = Joi.object().keys({
    riderId:Joi.number().example(1).description("Unique address identifier").optional(),
    status:Joi.number().example(1).description("Status of Riders account, Active or Deactive").optional(),
    searchText: Joi.string().trim().description("enter name to search for").optional(),
    isDeleted: Joi.number().example(1).description("value 0 or 1").optional(),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(parseInt(process.env.PAGINATION_LIMIT!)).description("number of records per page")
}).label('list-rider-request').description("Response object for riders list request")

const riderByRegionRequest: Joi.ObjectSchema = Joi.object().keys({
    zoneId:Joi.number().example(1).description("Zone ID").required(),
    regionId:Joi.number().example(1).description("Region ID").required(),
}).label('riders-by-region-request').description("Get all the riders for a region")

const listUsersResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('Token validated successfully'),
    responseData:Joi.object().keys({
        data:Joi.array().items(userObject).label('Array-of-user-objects'),
        page:Joi.number().optional().min(1).default(1).description("Page no"),
        perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).description("Number of records per page")
    }).label('user-list-response-data').description("Response object for user listing")
}).label('list-users-response').description("User listing response model")

const login:  Joi.ObjectSchema = Joi.object().keys({
    email:Joi.string().trim().email().required().example("email@domain.com").description("User's email id, allowed with type = email-password").error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED_AND_MUST_BE_VALID_EMAIL_ID')}),
    password:Joi.string().trim().required().example('password').description("User's password").error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}),
}).label('login-request').description("User login request will take either email/password or mobile no. in case of mobile, verify otp request would be required to verify the OTP");

const loginWithMobilePasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    countryCode:Joi.string().trim().required().example("+91").description("Country code").error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}),
    mobile:Joi.string().trim().required().example("422143243").description("User's mobile no.").error(errors=>{return Common.routeError(errors,'MOBILE_IS_REQUIRED')}),
    password:Joi.string().trim().required().example('password').description("User's password").error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}),
}).label('login-request').description("User login request will take either email/password or mobile no. in case of mobile, verify otp request would be required to verify the OTP");

const getRiderResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().example('Riders Details'),
    responseData:Joi.object().keys({
        name  :Joi.string().trim().example('Joe Biden'),
    }).label('rider-response-data').description("Response object for user listing")
}).label('rider-user-response').description("User listing response model")

const socialLogin :  Joi.ObjectSchema =  Joi.object().keys({
    platform:Joi.string().trim().optional().valid('google','apple').default('google').description("Platorm used for generating the access token"),
    token:Joi.string().required().example("valid-token").error(errors=>{return Common.routeError(errors,'ACCESS_TOKEN_IS_REQUIRED')}).description("token from google or apple login"),
    name:Joi.string().optional().allow(null).default(null)
}).label('social-login-request').description("Login using google and apple id")

const loginResponseWith2FA:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().example("valid jwt token"),
    qrcode:Joi.string().trim().example("Raw data for QRCODE")
}).label('2faAuthentication-response').description("Two factor authentication data")

const loginResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().trim().example("otp verified successfully").description('Success message from server'),
    responseData:Joi.object().keys({
        verification:login2FAVerification,
        user:user,
        newSocialAccount:Joi.boolean().optional().allow(null).example(true).description("If social login ends with new account")
    }).or('verification','user').label('login-response-options').description('Can have one of the described options')
}).label('login-response').description("User login response model")

const twoFactorQrResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().trim().example("login successfull").description('Success message from server'),
    responseData:loginResponseWith2FA
}).label('two-factor-qrcode-response').description("QRCode for 2FA")

const validate2FACode:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().required().example("token string").error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('token to validate the request'),
    varificationCode:Joi.string().required().example("123456").error(errors=>{return Common.routeError(errors,'CODE_IS_REQUIRED')}).description('Vrification token from authenticator app')
}).label('validate-2FAToken-response').description("Validate 2FA code to login")

const refreshTokenRequest :  Joi.ObjectSchema =  Joi.object().keys({
    refreshToken:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'REFRESH_TOKEN_IS_REQUIRED')}).description('Refresh token from login response')
}).label('refresh-token-request').description("Refresh token request will take refresh token from login response as input to generate a new token");

const refreshTokenResponse :  Joi.ObjectSchema =  Joi.object().keys({
    message: Joi.string().trim().description('Success message from server'),
    token:Joi.string().trim().description('New token from server')
}).label('refresh-token-response').description("Refresh token response model");

const changeUserPasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    userId:Joi.number().example(134234).description("Unique address identifier").required().error(errors=>{return Common.routeError(errors,'USER_ID_IS_REQUIRED')}),
    password:Joi.string().trim().min(8).required().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}).description('New password for the user'),
}).label('change-password-request').description("Change password would need old to validate the request and new password to make the changes ")

const changePasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    oldPassword:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'OLD_PASSWORD_IS_REQUIRED')}).description('Current password of the user'),
    newPassword:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'NEW_PASSWORD_IS_REQUIRED')}).description('Expected new password')
}).label('change-password-request').description("Change password would need old to validate the request and new password to make the changes ")

const forgetPasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    newPassword:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'NEW_PASSWORD_IS_REQUIRED')}).description('Expected new password')
}).label('forget-password-request').description("Change password, request new password to make the changes ")

const successOnlyResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('success message from server'),
}).label('success-only-response').description("Response with success message only")

const forgotPasswordRequest:  Joi.ObjectSchema = Joi.object().keys({
    email:Joi.string().trim().email().required().error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED')}).description('Registered email id')
}).label('forgot-password-request').description("Forgot password request to generate a request token")

const forgotPasswordResponse :  Joi.ObjectSchema =  Joi.object().keys({
    message: Joi.string().trim().description('Token for forgot password request'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('jwt-token')
    }).label('forgot-password-token')
}).label('forgot-password-response').description("Response model for forgot password request, generated token would be used by reset passwrod request model")

const resetPasseordRequest:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('Token generated from forgot password request'),
    code:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'CODE_IS_REQUIRED')}).description('Code sent to resgisted email id'),
    password:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}).description('Provide new password for the account')
}).label('reset-passeord-request').description("Reset password request would need token and code generated from forgot password request")

const resetPasseordResponse:  Joi.ObjectSchema = Joi.object().keys({
    message:Joi.string().trim().example("success message from server"),
    responseData:user
}).label('reset-passeord-response').description("Response model for reset password")

const reset2FAAuthRequest:  Joi.ObjectSchema = Joi.object().keys({
    email:Joi.string().trim().email().required().error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED')}).description('Registered email id')
}).label('reset-2FA-request').description("Request to reset 2FA authentication")

const reset2FAAuthResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Token for reset 2FA request'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('jwt-token')
    }).label('reset-2FA-token')
}).label('reset-2FA-response').description("Response model for 2FA reset request")

const validateReset2FARequest:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')}).description('Token generated from reset-2FA-request'),
    code:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'CODE_IS_REQUIRED')}).description('Code sent to resgisted email id')
}).label('validate-reset-2FA-request').description("Validate reset 2FA request by providing the code sent to registered email id")

const validateReset2FAResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('jwt-token')
    }).label('2fa-QR-code-from-reset-2FA-token')
}).label('validate-reset-2FA-response').description("Token to get QR code for 2FA process")

const get2FATokenResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('jwt-token')
    }).label('2fa-QR-code-to-set-2FA-token')
}).label('set2FA-response').description("Token to get QR code for 2FA process")

const newAccountRequest:  Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}).description('Name of the user'),
    email:Joi.string().trim().email().required().error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED')}).description('Email of the user')
}).label('new-account').description("Create new account")

const newAccountResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
}).label('new-account-response').description("Response for new account request")

const userSettings:  Joi.ObjectSchema = Joi.object().keys({
    skipSubscriptionPage:Joi.boolean().example(true).description("Boolean value for skip subscription").optional(),
    skipDashboardTour:Joi.boolean().example(true).description("Boolean value for skip dashboard tour").optional(),
}).label('user-settings').description("Request and Response object for user settings")

const statsResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:Joi.object().keys({
        accountStats:Joi.object().keys({
            files:Joi.number(),
            messages:Joi.number(),
            directories:Joi.number(),
            spaceUsed:Joi.number(),
            totalStorage:Joi.number(),
            nominees:Joi.number()
        }).label('user-stats'),
        nomineeStats:Joi.object().keys({
            files:Joi.number(),
            messages:Joi.number(),
            accountHolders:Joi.number()
        }).label('nominee-stats'),
        universalNomineeStats:Joi.object().keys({
            files:Joi.number(),
            messages:Joi.number(),
            accountHolders:Joi.number()
        }).label('universal-nominee-stats')

    }).label('stats-responsesData').description("Resultset for user stats")
}).label('account-stats').description("Request and Response object for user settings")

const updateFcmToken :  Joi.ObjectSchema =  Joi.object().keys({
    fcmToken:Joi.string().trim().example("fcm_token").description("FCM TOKEN").required().error(errors=>{return Common.routeError(errors,'FCM_TOKEN_IS_REQUIRED')}),

}).label('user-fcm_token-update').description("Request for updating user fcm token")

const updateFcmTokenResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
}).label('user-update-fcm-token-response').description("Response for updating user's fcm token")

const updateProfile :  Joi.ObjectSchema =  Joi.object().keys({
    name:Joi.string().trim().example("Joe Biden").description("Name of the user").required().error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}),
    imageId: Joi.number().strict().description('attachment id to be used as profile image').optional().allow(null),
    email:Joi.string().trim().email().allow(null,"").example("email@domain.com").description("User's email id"),
    gender:Joi.string().trim().allow(null).example("Male").valid("Male","Female","Other").description("User's gender"),
    address1 : Joi.string().allow("").optional().example(' Address A').description('Address 1 of the user'),
    address2 : Joi.string().allow("").optional().example(' Address B').description('Address 2 of the user'),
    address3 : Joi.string().allow("").optional().example(' Address C').description('Address 3 of the user'),
    pin : Joi.string().allow("").optional().example('123456').description('Pin of the user'),
    stateId : Joi.number().strict().description('state id of the user').optional().allow(null,''),
    stateName : Joi.string().allow("").optional().example('Maharashtra').description('Name of the state of the user'),
    occupation : Joi.string().description('User Occupation').example('Social Media Influencer').optional().allow(null,'')
    // password: Joi.string().example("********").description('PASSWORD FOR THE USER PROFILE').optional()
}).label('user-profile-update').description("Request for updating user profile")

const createProfile :  Joi.ObjectSchema =  Joi.object().keys({
    name:Joi.string().trim().example("Joe Biden").description("Name of the user").required().error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}),
    imageId: Joi.number().strict().description('attachment id to be used as profile image').optional().allow(null),
    email:Joi.string().trim().email().allow("",null).example("email@domain.com").description("User's email id"),
    gender:Joi.string().trim().allow("",null).example("Male").valid("Male","Female","Other").description("User's gender"),
    address1 : Joi.string().allow("").optional().example(' Address A').description('Address 1 of the user'),
    address2 : Joi.string().allow("").optional().example(' Address B').description('Address 2 of the user'),
    address3 : Joi.string().allow("").optional().example(' Address C').description('Address 3 of the user'),
    pin : Joi.string().allow("").optional().example('123456').description('Pin of the user'),
    stateId : Joi.number().strict().description('state id of the user').optional(),
    occupation : Joi.string().description('User Occupation').example('Social Media Influencer').optional().allow(null,'')
    // password: Joi.string().example("********").description('PASSWORD FOR THE USER PROFILE').optional().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')})
}).label('user-profile-update').description("Request for updating user profile")

//Create a modified schema for the response, excluding the "password" field
const responseProfileData: Joi.ObjectSchema = Joi.object().keys({
    
        name: updateProfile.extract('name'), // Include other fields from updateProfile
        imageId: updateProfile.extract('imageId'),
        email: updateProfile.extract('email'),
        gender: updateProfile.extract('gender'),
        attachment:user.extract('Attachment'),
}).label('user-profile-response').description("Response for updating user profile");

const updateProfileResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:responseProfileData
}).label('user-profile-response').description("Response for updating user profile")

const createRiderProfile :  Joi.ObjectSchema =  Joi.object().keys({
    name:Joi.string().trim().example("Joe Biden").description("Name of the user").required().error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}),
    imageId: Joi.number().strict().description('attachment id to be used as profile image').optional(),
    accountId: Joi.number().optional().description('owner account Id'),
    countryCode:Joi.string().pattern(/^[+0-9]+$/).required().error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}).example("+91").description("Country Code"),
    mobile:Joi.number().required().error(errors=>{return Common.routeError(errors,'MOBILE_NO_IS_REQUIRED')}).example("9999999999").description("Mobile no is required"),
    email:Joi.string().trim().email().allow(null).example("email@domain.com").description("User's email id"),
    gender:Joi.string().trim().allow(null).example("Male").description("User's gender"),
    aadhaarNumber: Joi.number().example("999999999999").description("Riders Aadhaar Number as ID proof 12 digits"),
    startShiftTime: Joi.string().description("End Shift Time of the Rider").allow(null),
    endShiftTime: Joi.string().description("End Shift Time of the Rider").allow(null),
    bloodGroup: Joi.string().trim().example("B+").strict().description("Rider's blood group"),
    dateOfBirth: Joi.string().strict().example("year-mm-date").description("Date of Birth of the Rider"),
    vehicleType: Joi.string().trim().strict().description("Rider's Vehicle Type: One wheeler, two wheeler"),
    vehicleNumber: Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number"),
    vehicleName:Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number"),
    vehicleCountry:Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number"),
    emergencyCountryCode:Joi.string().pattern(/^[+0-9]+$/).example("+91").description("Country Code"),
    emergencyContact:Joi.number().example("9999999999").description("Mobile no is required"),
    emergencyContactRelation:Joi.string().trim().example("Father"),
    emergencyContactRelationName:Joi.string().trim().example("S Kumar"),
    idProof: Joi.array().items(Joi.number()).description('image id of the question').example([1,2,3,4]).optional().allow(null),
    bankName:Joi.string().trim().example("Bank Name").description("Name of the Bank").required().error(errors=>{return Common.routeError(errors,'Bank Name is required')}),
    bankAccountNumber:Joi.string().trim().example("Bank Account Number").description("Bank Account Number").required().error(errors=>{return Common.routeError(errors,'Bank Accoount Number is required')}),
    ifsc:Joi.string().trim().example("IFSC").description("IFSC ").required().error(errors=>{return Common.routeError(errors,'IFSC')}),
    address: Joi.string().trim().example("New lane 8, New York City").description('rider address details'),
    insuranceCompany :  Joi.string().trim().example("New lane 8, New York City").description('rider address details').optional().allow(null),
    alternateCountryCode :  Joi.string().trim().example("+91").description('rider address details').optional().allow(null),
    alternateContact :  Joi.string().trim().example("9999999999").description('rider address details').optional().allow(null),
    liscenseNumber :  Joi.string().trim().example("123456789").description('rider address details').optional().allow(null),
    joiningDate :  Joi.string().strict().example("year-mm-date").description("joining Rider").optional().allow(null),
    password: Joi.string().example("********").description('PASSWORD FOR THE USER PROFILE').required().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')})
}).label('rider-profile-create').description("Request for creating user profile")

const updateRiderProfile :  Joi.ObjectSchema =  Joi.object().keys({
    riderId:Joi.number().example(1).description("Unique address identifier").required().error(errors=>{return Common.routeError(errors,'USER_STATUS_IS_REQUIRED')}),
    name:Joi.string().trim().example("Joe Biden").description("Name of the user").optional().allow(null),
    imageId: Joi.number().strict().description('attachment id to be used as profile image').optional().allow(null),
    countryCode:Joi.string().optional().example("+91").description("Country Code").allow(null).optional(),
    mobile:Joi.number().optional().example("9999999999").description("Mobile no is required").allow(null),
    email:Joi.string().trim().email().allow(null).example("email@domain.com").description("User's email id").optional(),
    gender:Joi.string().trim().allow(null).example("Male").description("User's gender").optional(),
    aadhaarNumber: Joi.number().example("999999999999").description("Riders Aadhaar Number as ID proof 12 digits").optional().allow(null),
    startShiftTime: Joi.string().description("End Shift Time of the Rider").allow(null).optional(),
    endShiftTime: Joi.string().description("End Shift Time of the Rider").allow(null).optional(),
    bloodGroup: Joi.string().trim().example("B+").strict().description("Rider's blood group").optional().allow(null),
    dateOfBirth: Joi.string().strict().example("year-mm-date").description("Date of Birth of the Rider").optional().allow(null),
    vehicleType: Joi.string().trim().strict().description("Rider's Vehicle Type: One wheeler, two wheeler").optional().allow(null),
    vehicleNumber: Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number").optional().allow(null),
    vehicleName:Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number").optional().allow(null),
    vehicleCountry:Joi.string().strict().example("KA-03-HA-1985").description("Rider's Vehicle Number").optional().allow(null),
    bankName:Joi.string().trim().example("Bank Name").description("Name of the Bank").optional().allow(null),
    bankAccountNumber:Joi.string().trim().example("Bank Account Number").description("Bank Account Number").optional().allow(null),
    ifsc:Joi.string().trim().example("IFSC").description("IFSC ").optional().allow(null),
    emergencyCountryCode:Joi.string().pattern(/^[+0-9]+$/).example("+91").description("Country Code"),
    emergencyContact:Joi.number().example("9999999999").description("Mobile no is required"),
    emergencyContactRelation:Joi.string().trim().example("Father"),
    emergencyContactRelationName:Joi.string().trim().example("S Kumar"),
    idProof: Joi.array().description('image id of the question').example([1,2,3,4]).optional().allow(null),
    insuranceCompany :  Joi.string().trim().example("New lane 8, New York City").description('rider address details').optional().allow(null),
    alternateCountryCode :  Joi.string().trim().example("+91").description('rider address details').optional().allow(null),
    alternateContact :  Joi.string().trim().example("9999999999").description('rider address details').optional().allow(null),
    liscenseNumber :  Joi.string().trim().example("123456789").description('rider address details').optional().allow(null),
    address: Joi.string().trim().example("New lane 8, New York City").description('rider address details').optional().allow(null),
    password: Joi.string().example("********").description('PASSWORD FOR THE BUSINESS PROFILE').optional().allow(null),
    joiningDate :  Joi.string().strict().example("year-mm-date").description("joining Rider").optional().allow(null),
    status:Joi.number().example(1).description("Active/inactive status of role, 1=> Active, 0=> Inactive").optional().default(1).allow(null)
}).label('rider-profile-update').description("Request for updating user profile")

const updateBusinessProfile :  Joi.ObjectSchema =  Joi.object().keys({
    imageId: Joi.number().strict().description('attachment id to be used as profile image').optional(),
    businessCategory:Joi.number().example("1").description("Name of Business Type or Category").required().error(errors=>{return Common.routeError(errors,'BUSINESS_CATEGORY_IS_REQUIRED')}),
    avgDailyOrders:Joi.number().example(10).description("Average number daily orders").error(errors=>{return Common.routeError(errors,'AVERAGE_NUMBER_OF_DAILY_ORDER_IS_REQUIRED')}),
    companyName:Joi.string().trim().example("XYZ").description("Name of the Company").error(errors=>{return Common.routeError(errors,'COMPANY_NAME_IS_REQUIRED')}),
    companyEmailAddress:Joi.string().trim().email().example("abc@gmail.com").description("Email Address of the Company").error(errors=>{return Common.routeError(errors,'COMPANY_EMAIL_ADDRESS_IS_REQUIRED')}),
    companyWebsite:Joi.string().trim().example("www.abc.com").description("Website of the company").optional().allow(null,""),
    password: Joi.string().example("********").description('PASSWORD FOR THE BUSINESS PROFILE').optional()
}).label('user-business-profile-update').description("Request for updating user business profile")

const createBusinessProfile :  Joi.ObjectSchema =  Joi.object().keys({
    imageId: Joi.number().strict().description('attachment id to be used as profile image'),
    businessCategory:Joi.number().example("1").description("Name of Business Type or Category").required().error(errors=>{return Common.routeError(errors,'BUSINESS_CATEGORY_IS_REQUIRED')}),
    avgDailyOrders:Joi.number().example(10).description("Average number daily orders").error(errors=>{return Common.routeError(errors,'AVERAGE_NUMBER_OF_DAILY_ORDER_IS_REQUIRED')}),
    companyName:Joi.string().trim().example("ZYZ").description("Name of the Company").error(errors=>{return Common.routeError(errors,'COMPANY_NAME_IS_REQUIRED')}),
    companyEmailAddress:Joi.string().trim().email().example("abc@gmail.com").description("Email Address of the Company").error(errors=>{return Common.routeError(errors,'COMPANY_EMAIL_ADDRESS_IS_REQUIRED')}),
    companyWebsite:Joi.string().trim().example("www.abc.com").optional().allow(null,""),
    password: Joi.string().example("********").when('id', {is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required().error(errors=>{return Common.routeError(errors,'PASSWORD_IS_REQUIRED')}).description('PASSWORD FOR THE BUSINESS PROFILE')})

}).label('user-business-profile-update').description("Request for updating user business profile")

//Create a modified schema for the response, excluding the "password" field
const responseBusinessProfileData: Joi.ObjectSchema = Joi.object().keys({  
    imageId: updateBusinessProfile.extract('imageId'),
    businessCategory: updateBusinessProfile.extract('businessCategory'), 
    avgDailyOrders: updateBusinessProfile.extract('avgDailyOrders'), 
    companyName: updateBusinessProfile.extract('companyName'), 
    companyEmailAddress: updateBusinessProfile.extract('companyEmailAddress'),
    companyWebsite:updateBusinessProfile.extract('companyWebsite'),
    categoryDetails:CategoryDetails,
    attachment:user.extract('Attachment'),
}).label('user-business-profile-response').description("Response for updating user profile");

const updateBusinessProfileResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:responseBusinessProfileData
}).label('user-profile-response').description("Response for updating user business profile")

const updateProfileImage:  Joi.ObjectSchema = Joi.object().keys({
    imageId: Joi.number().strict().description('attachment id to be used as profile image').required().error(errors=>{return Common.routeError(errors,'IMAGE_ID_REQUIRED')}),
}).label('update-profile-image-request').description("Request to update user profile image")

const updateProfileImageResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:{
        profileImage:Joi.string().allow(null).example("http://www.domain.com/image.jpg").description("User's profile image")
    }
}).label('update-profile-image-request').description("Request to update user profile image")

const changeEmailRequest=Joi.object().keys({
    email:Joi.string().trim().email().required().error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED')}).description('Registered email id')
}).label('change-email-request').description("Change email request to generate a request token")

const changeEmailResponse :  Joi.ObjectSchema =  Joi.object().keys({
    message: Joi.string().trim().description('Token for change email request'),
    responseData:Joi.object().keys({
        token:Joi.string().trim().example('jwt-token')
    }).label('change-email-token')
}).label('change-email-response').description("Response model for change email request, generated token would be used by verify change email request")

const resendEmailVerificationCodeRequest:  Joi.ObjectSchema = Joi.object().keys({
    token:Joi.string().trim().example('jwt-token').required().error(errors=>{return Common.routeError(errors,'TOKEN_IS_REQUIRED')})
});
const resendEmailVerificationCodeResponse:  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
});

const updateUserStatus :  Joi.ObjectSchema =  Joi.object().keys({
    status:Joi.boolean().required().error(errors=>{return Common.routeError(errors,'USER_STATUS_IS_REQUIRED')}).valid(true,false).description("Status of the user")
}).label('user-status-request').description("Request to update the status of the user")

const updateUserStatusResponse :  Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
}).label('user-status').description("User status update")

const userIdentifier:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the user")
}).label('user-identifier').description("User identifier")

const riderIdentifier:  Joi.ObjectSchema = Joi.object().keys({
    mobile:Joi.string().trim().example("9999999999").description("Mobile as an identifier for the Rider ")
}).label('rider-identifier').description("Rider identifier")

const riderIdIdentifier:  Joi.ObjectSchema = Joi.object().keys({
    riderId:Joi.number().required().example(1).description("Unique address identifier").required().error(errors=>{return Common.routeError(errors,'USER_STATUS_IS_REQUIRED')}),
}).label('rider-identifier').description("Rider identifier")

const userDataObject = user.keys({token:Joi.forbidden(),refreshToken:Joi.forbidden()}).label("userObject");
const getUserResponse :  Joi.ObjectSchema =Joi.object().keys({
    message: Joi.string().trim().description('Request success message'),
    responseData:userDataObject
}).label('user-data').description("User data");

const getUserLogoutResponse :  Joi.ObjectSchema =Joi.object().keys({
    message: Joi.string().trim().description('Logout Successfully'),
}).label('user-logout').description("User Logout Response");

const addressIdentifier :  Joi.ObjectSchema =Joi.object().keys({
    id: Joi.number().example(1).description("Unique identifier").required().error(errors=>{return Common.routeError(errors,'ID_REQUIRED')}),
}).label('identifier').description("identifier");

const addressIdentifierOpt :  Joi.ObjectSchema =Joi.object().keys({
    id: Joi.number().example(1).description("Unique address identifier").optional().allow(null),
    isdefaultAddress: Joi.boolean().example("true").optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage:Joi.number().optional().min(1).default(parseInt(process.env.PAGINATION_LIMIT!)),
    searchText:Joi.string().optional().allow(null).example("rahul").description("enter text to filter")
}).label('user-address').description("User address");

const contactIdentifierOpt :  Joi.ObjectSchema =Joi.object().keys({
    id: Joi.number().example(1).description("Unique address identifier").optional().allow(null),
    isdefaultAddress: Joi.boolean().example("true").optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage:Joi.number().optional().min(1).default(parseInt(process.env.PAGINATION_LIMIT!)),
    searchText:Joi.string().trim().optional().allow(null).description("Search Text")
}).label('user-address').description("User address");

const riderRegionsRequest :  Joi.ObjectSchema = Joi.object().keys({
    zoneId: Joi.number().required().error(errors=>{return Common.routeError(errors,'ZONE_IS_REQUIRED')}).example("2321").description('Package Zone id is required'),
    regionId: Joi.number().required().error(errors=>{return Common.routeError(errors,'REGION_ID_IS_REQUIRED')}).example("2321").description('Region id is required'),
})

const riderZoneRequest :  Joi.ObjectSchema = Joi.object().keys({
    riderId: Joi.number().required().error(errors=>{return Common.routeError(errors,'USER_ID_IS_REQUIRED')}).example("2321").description('User id is required'),
    zoneId: Joi.number().required().error(errors=>{return Common.routeError(errors,'ZONE_ID_IS_REQUIRED')}).example("2321").description('Zone id is required'),
    riderRegions:Joi.array().required().items(riderRegionsRequest).error(errors=>{return Common.routeError(errors,'RIDER_REGIONS_IS_HAVING_SOME_ISSUE')}).description('Required'), 

})

const createStaffRequest: Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().example("name").description("name").error(errors=>{return Common.routeError(errors,'NAME_IS_REQUIRED')}),
    email:Joi.string().email().example("email@domain.com").description("User's email id, allowed with type = email-password").error(errors=>{return Common.routeError(errors,'EMAIL_IS_REQUIRED_AND_MUST_BE_VALID_EMAIL_ID')}),
    password:Joi.string().trim().optional().example('password').description("User's password"),
    countryCode:Joi.string().trim().required().example('+91').description("country code").error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}),
    mobile:Joi.string().trim().required().example('9999999999').description("mobile").error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}),
    roles: Joi.array().items(Joi.string().trim().required()).min(1).error(errors=>{return Common.routeError(errors,'ROLES_ARE_REQUIRED')}),
    imageId : Joi.number().optional().allow(null).example('1').description('image id of the staff')
}).label('assign-user-roles').description("assign user roles")

const updateStaffRequest: Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().example("name").description("name").optional().default(null).allow(null),
    email:Joi.string().email().example("email@domain.com").description("User's email id, allowed with type = email-password").optional().default(null).allow(null),
    password:Joi.string().trim().optional().example('password').description("User's password"),    countryCode:Joi.string().trim().required().example('+91').description("country code").error(errors=>{return Common.routeError(errors,'COUNTRY_CODE_IS_REQUIRED')}),
    mobile:Joi.string().trim().required().example('9999999999').description("mobile").optional().default(null).allow(null),
    roles: Joi.array().items(Joi.string().trim().required()).optional().default(null).allow(null),
    imageId : Joi.number().optional().allow(null).example('1').description('image id of the staff')
}).label('assign-user-roles').description("assign user roles")

const listUserRequest = Joi.object().keys({
    searchText: Joi.string().trim().allow("").optional().default(null),
    page : Joi.number().optional().default(1),
    perPage:Joi.number().optional().min(1).default(parseInt(process.env.PAGINATION_LIMIT!)),
    role: Joi.array().items(Joi.string().trim().required()).single().optional().default(null),
    
    status: Joi.number().optional().default(null)
}).label('user-list').description("User list");

const listUserByRoleRequest = Joi.object().keys({
    role: Joi.array().items(Joi.string().trim().required()).single().optional().default(null),
    status: Joi.number().optional().default(null)
}).label('user-list').description("User list");

const listUserWithoutPaginateRequest = Joi.object().keys({
    // searchText: Joi.string().trim().allow("").optional().default(null),
    role: Joi.array().items(Joi.string().trim().required()).single().optional().default(null),
    status: Joi.number().optional().default(null)
}).label('user-list').description("User list");

const userAttendanceRequest:  Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().example("Ravi").description("Rider name"),
    date:Joi.date().example("2023-01-02T12:18:55.000Z").description("Calendar date").required(),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(parseInt(process.env.PAGINATION_LIMIT!)).description("number of records per page")
    
}).label("rider-attendance-request").description('Iso string date')

const riderDepositsRequests:  Joi.ObjectSchema = Joi.object().keys({
    riderId:Joi.number().example("1").description("Rider id"),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(parseInt(process.env.PAGINATION_LIMIT!)).description("number of records per page")
    
}).label("rider-desposits-request").description('Iso string date')

const merchantSettlementListRequests:  Joi.ObjectSchema = Joi.object().keys({
    merchantId:Joi.number().example("1").description("Merchant id"),
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(parseInt(process.env.PAGINATION_LIMIT!)).description("number of records per page")
    
}).label("rider-desposits-request").description('Iso string date')

const shiftCreateRequest :  Joi.ObjectSchema = Joi.object().keys({
    name:Joi.string().required().error(errors=>{return Common.routeError(errors,'SHIFT_NAME_IS_REQUIRED')}).example("Morning shift").description('Name'),
    startTime:Joi.string().required().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).error(errors=>{return Common.routeError(errors,'START_TIME_REQUIRED')}).example("10:00:00").description('It should be in 24hr format like: 10:00:00'),
    endTime:Joi.string().required().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).error(errors=>{return Common.routeError(errors,'END_TIME_REQUIRED')}).example("18:00:00").description('It should be in 24hr format like: 10:00:00'),
}).label('shift-create-request').description('Shift create request');

const shiftUpdateRequest :  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'SHIFT_ID_IS_REQUIRED')}).example("2").description('ID'),
    name:Joi.string().required().error(errors=>{return Common.routeError(errors,'SHIFT_NAME_IS_REQUIRED')}).example("Morning shift").description('Name'),
    startTime:Joi.string().required().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).error(errors=>{return Common.routeError(errors,'START_TIME_REQUIRED')}).example("10:00:00").description('It should be in 24hr format like: 10:00:00'),
    endTime:Joi.string().required().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).error(errors=>{return Common.routeError(errors,'END_TIME_REQUIRED')}).example("18:00:00").description('It should be in 24hr format like: 18:00:00'),
}).label('shift-update-request').description('Shift update request');

const shiftStatusUpdateRequest :  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'SHIFT_ID_IS_REQUIRED')}).example("23").description('Shift Id'),
    status:Joi.number().required().error(errors=>{return Common.routeError(errors,'SHIFT_STATUS_IS_REQUIRED')}).example("1").description('Shift status'),
}).label('shift-status-update-request').description('Shift status update request');

const listShiftRequest: Joi.ObjectSchema = Joi.object().keys({
    page:Joi.number().optional().min(1).default(1).description("page no"),
    perPage:Joi.number().optional().max(Number(process.env.PAGINATION_LIMIT)).default(parseInt(process.env.PAGINATION_LIMIT!)).description("number of records per page")
}).label('list-rider-request').description("Response object for riders list request")

const shiftByIdRequest :  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().required().error(errors=>{return Common.routeError(errors,'SHIFT_ID_IS_REQUIRED')}).example("23").description('Shift Id'),
    
}).label('shift-status-update-request').description('Shift status update request');

const riderAssignShiftsRequest :  Joi.ObjectSchema = Joi.object().keys({
    shiftIds:Joi.array().items(
        Joi.number()
    ).required().min(1).description("Ids of shifts"),
    riderId:Joi.number().required().error(errors=>{return Common.routeError(errors,'RIDER_ID_REQUIRED')}).example("2").description('Rider id'),
}).label('shift-assign-request').description('Shift assign request');

export {
    createStaffRequest,
    updateStaffRequest,
    signup,
    signupResponse,
    validateToken,
    validateTokenResponse,
    verifyEmail,
    verifyEmailResponse,
    user,
    loginResponseWith2FA,
    twoFactorQrResponse,
    login,
    socialLogin,
    loginResponse,
    validate2FACode,
    changePasswordRequest,
    successOnlyResponse,
    refreshTokenRequest,
    refreshTokenResponse,
    listUsers,
    listUsersResponse,
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
    createProfile,
    updateProfile,
    updateProfileResponse,
    createBusinessProfile,
    updateBusinessProfile,
    updateBusinessProfileResponse,
    updateProfileImage,
    updateProfileImageResponse,
    changeEmailRequest,
    changeEmailResponse,
    resendEmailVerificationCodeRequest,
    resendEmailVerificationCodeResponse,
    userIdentifier,
    updateUserStatus,
    updateUserStatusResponse,
    getUserResponse,
    loginWithMobileAndPasswordRequest,
    loginWithMobileAndPasswordResponse,
    updateFcmToken,
    updateFcmTokenResponse,
    getUserLogoutResponse,
    createRiderProfile,
    updateRiderProfile,
    riderlistUsers,
    riderIdentifier,
    getRiderResponse,
    addressIdentifier,
    addressIdentifierOpt,
    riderIdIdentifier,
    contactIdentifierOpt,
    changeUserPasswordRequest,
    loginWithMobilePasswordRequest,
    riderZoneRequest,
    riderByRegionRequest,
    listUserRequest,
    driverOnlineStatusRequest,
    userAttendanceRequest,
    riderDepositsRequests,
    shiftCreateRequest,
    shiftUpdateRequest,
    shiftStatusUpdateRequest,
    listShiftRequest,
    shiftByIdRequest,
    riderAssignShiftsRequest,
    merchantSettlementListRequests,
    listIndividualUsers,
    listBusinessUsers,
    getStatesbyPhoneCode,
    listUserWithoutPaginateRequest,
    listUserByRoleRequest,
    verifyOTPQuery
}