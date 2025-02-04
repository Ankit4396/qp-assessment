
import { ServerRoute} from "@hapi/hapi"
import {Joi} from '../config/routeImporter';
import { Json } from 'sequelize/types/utils';


// Email template interfaces
interface EmailTemplate{
    id?: number;
    code: string;
    replacements:string;
    userId:number;
    accountId:number | null;
    lastUpdatedById:number | null;
    isRevision:boolean | null;
    revisionId:number | null;
    status:number;
    EmailTemplateContents?:EmailTemplateContent[]
}

interface EmailTemplateContent{
    id?: number;
    EmailTemplateId?: number;
    languageId?:number;
    title:string;
    message:string;
    messageText:string;
    subject:string;
}

//User template interfaces

interface UserInterface {
    id?: number;
    imageId?:number | null;
    email: string | null;
    countryCode?:string;
    mobile:string | null;
    password?:string | null;
    secret?:string;
    signUpSource?:number;
    socialPlatform?: string;
    socialPlatformId?: string;
    googleIdentifier?:string;
    appleIdentifier?:string;
    status:number;
    UserProfile?:UserProfileInterface,
    UserSettings?:UserSetting,
    userAccounts?:UserAccount[],
    Attachment?:AttachmentInterface,
    Roles?:RoleInterface[],
    fcmToken?:string | null,
    createdAt?:Date,
    updatedAt?:Date,
    lastLocation?:Json | null
    onlineStatus?:number,
    
    
}




interface UserAccount{
    id?: number;
    userId?: number;
    accountId:number | null;
    isDefault:boolean;
   
}
interface UserProfileInterface{
    // Some fields are optional when calling UserModel.create() or UserModel.build()
    id?: number;
    userId?: number;
    name?:string;
    imageId?:number | null;
    email?:UserInterface["email"];
    gender?:string | null;
    stateId?:number | null;
    stateName?:string | null;
    pin?:string | null;
    address1?:string | null;
    address2?:string | null;
    address3?:string | null;
    password?: UserInterface["password"];
    occupation?: string
}
interface UserSetting{
    id?: number;
    userId?: number;
    twoFactorAuthentication?:boolean;
    skipSubscriptionPage?:boolean;
    skipDashboardTour?:boolean;
    hasUniversalNominee?:boolean;
    kycStatus?:boolean;
    // distanceUnit:DistanceUnit
}
interface UserDetails{
    userId:number,
    accountId:number | null,
    newaccount:boolean,
}


interface TokenInterface{
    id?: number;
    type: string;
    email: string | null;
    countryCode:string | null;
    mobile: string | null;
    userId: number | null;
    accountId: number | null;
    token: string;
    code?: string;
    status: number;
    verificationsAttempts:number;
    signUpSource?: string;
    createdAt?: Date | null;
    updatedAt?: Date | null;

}

//Category 

interface CategoryInterface{
    id?: number;
    code: string;
    categorytypeId:number;
    parentId: number|null;
    userId:number|null;
    accountId: number|null;
    adminOnly?:Boolean;
    lastUpdatedBy?: number |null;
    isRevision?:boolean;
    imageId:number|null;
    revisionId?:number|null;
    orderSequence?:string;
    level?:number;
    status?:number;
    parent?:{
        id:number,
        code:string,
        name:string
    }
    CategoryContents?:CategoryContentInterface[]
    CategoryType?:CategoryTypeInterface | null
}


interface CategoryContentInterface{
    id?: number;
    categoryId?:number;
    languageId?: number;
    name:string;
    description?:string;
    descriptionText?:string;
  
}

interface CategoryTypeInterface{
    id?: number;
    code: string;
    userId:number;
    lastUpdatedBy?:number | null;
    isRevision?:Boolean;
    revisionId?:number;
    status:number;
    CategorytypeContents?:CategoryTypeContentInterface[];
}

interface CategoryTypeContentInterface {
    id?: number;
    categorytypeId?: number;
    languageId?: number;
    name:string;
    description:string;
    descriptionText:string;
}

//Attachments

interface AttachmentInterface{
    id?: number;
    fileName: string;
    userId:number;
    accountId?:number;
    extension:string;
    uniqueName:string;
    filePath:string;
    thumbnailId?:number | null;
    type?:number;
    size:number;
    dataKey?:Text;
    status:number;
    updatedAt?:Date;
    createdAt?:Date;
}

interface AppVersionInterface{
    id?:number;
    userId?:number;
    ios_soft_update?:string;
    ios_critical_update?:number;
    android_soft_update?:number;
    android_critical_update?:number;
}


interface NotificationInterface {
    id?: number;
    userId?: number;
    code?: string;
    title?: string;
    body?: string;
    data?: string | null;
    isRead?: number;
}

interface UserSessionInterface {
    id?:number;
    userId?:number;
    deviceToken?:string | null;
    deviceType?:number | null;
    status?:number | null;
}

// Settings Interface 
interface SettingsInterface{
    id: number;
    tax: string;
    lastUpdatedBy:number
}

// Role Interface 
interface RoleInterface{
    id?: number;
    code?: string;
    userId?:number;
    lastUpdatedBy?:number
    accountId?:number;
    isRevision?:boolean;
    revisionId?:number;
    isDefault?:boolean;
    status?:number;
    Permissions?:Permission[];
    RoleContents?: RoleContent[]
}

// Roles contents

interface RoleContent{
    id?: number;
    roleId?: number;
    languageId?:number;
    name?:string;
 
}

// Permission
interface Permission{
    id?: number;
    userId?: number;
    accountId?:number;
    lastUpdatedBy?:number;
    code?:string;
    adminOnly?:boolean;
    isRevision?:boolean;
    revisionId?:number;
    status?:number;
    PermissionContents?: PermissionContent[]
}

interface PermissionContent{
    id?: number;
    permissionId?: number;
    languageId?:number;
    name?:Text;
    description?:Text;
}










interface ContactUs{
 id?:number,
 email?:string,
 countryCode?:string,
 mobile?:number,
 partnershipEmail?:string,
 officeAddress?:string,
 facebook?:string,
 instagram?:string,
 twitter?:string,
 metaData?:JSON
}

interface GeneralSettings{
    id?: number;
    userId?:number;
    hotelCommissionRate?:number;
    flightCommissionRate?:number;
    tourGuideCommissionRate?:number;
    activitiesCommissionRate?:number;
    isRevision?:boolean;
    lastUpdatedBy?:number;
    revisionId?:number;


}
interface GroceryItems{
    id?:number;
    name?:Text;
    coverImage?:number;
    description?:Text;
    overview?:Text;
    inStock?:boolean;
    leftQuantity?:number;
    lastUpdatedBy?:number;
    price?:number;
    isAnyOfferActive?:boolean;
    offerPrice?:number | null;
    discount?:number | null;
    status?:number;
    isParent?:boolean;
    haveVariant?:boolean;
    isVariant?:boolean;
    parentId?:number | null;
    isDefaultVariant?:boolean;

}


interface OrderInterface{
  id?:number;
  customerId?:number | null;
  cartTotalValue?:number | null;
  cartFinalValue?:number | null;
  totalDiscount?:number | null;
  deliveryCharge?:number | null;
  address?:Text | null;
  modeOfPayment?:number;
  isPaid?:boolean;
  deliveryStatus?:number;
  transactionId?:number | null;
  transactionStatus?:number | null;
  deliveredAt?:Date | null;
  deliverEstimateTime?:string | null;
  status?:number;
}

interface OrderDetailsInterface{
    id?:number;
    orderId?:number;
    itemId?:number;
    quantity?:number;
    totalDiscount?:number;
    finalPrice?:number;
    price?:number;
}

interface TransactionInterface{
    id?:number;
    paymentId?:number;
    transactionData?:JSON;
    status?:number;

}




type RouteType = ServerRoute & {
    options: {
      validate: {
        validator: typeof Joi
      }
    }
}




export {  
    EmailTemplate, 
    EmailTemplateContent, 
    UserInterface, 
    UserSetting,
    UserAccount,
    UserDetails,
    UserSessionInterface,
    UserProfileInterface,
    TokenInterface,
    RoleInterface,
    Permission,
    RouteType,
    CategoryInterface,
    CategoryContentInterface,
    CategoryTypeInterface,
    CategoryTypeContentInterface,
    AttachmentInterface,
    AppVersionInterface,
    NotificationInterface,
    SettingsInterface,
    PermissionContent,
    ContactUs,
    GeneralSettings,
    GroceryItems,
    OrderInterface,
    OrderDetailsInterface,
    TransactionInterface
}

