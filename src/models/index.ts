"use strict";
import { Dialect, Sequelize } from 'sequelize'
import * as Fs from 'file-system';
import * as path from 'path';
const {DB_NAME,DB_USER_NAME,DB_PASSWORD,DB_HOST} = require(__dirname + '/../config/config')[process.env.NODE_ENV!];
var sequelize = new Sequelize(
    DB_NAME,
    DB_USER_NAME,
    DB_PASSWORD,
    { 
        define: {
            charset: "utf8mb4",
            collate: "utf8mb4_general_ci"
        },
        host: DB_HOST,
        dialect: process.env.MYSQL_DIALECT! as Dialect,
        dialectOptions: {
            ssl: { rejectUnauthorized: false },
        },
        port: +process.env.MYSQL_PORT!,
        pool: {
            max: +process.env.DB_POOL_MAX!,
            min: +process.env.DB_POOL_MIN!,
            acquire: +process.env.DB_POOL_ACQUIRE!,
            idle: +process.env.DB_POOL_IDLE!
        }
    }
);
import Attachment  from './Attachment';
import Language from './Language';
import CategoryType from './CategoryType';
import CategoryTypeContent from './CategoryTypeContent';
import Category from './Category';
import CategoryContent from './CategoryContent';
import User from "./User";
import UserProfile from './UserProfile';
import UserSetting from './UserSetting';
import UserAccount from './UserAccount';
import Role from './Role';
import RoleContent from './RoleContent';
import Permission from './Permission';
import PermissionContent from './PermissionContent';
import Email from './Email';
import EmailTemplate from './EmailTemplate';
import EmailTemplateContent from './EmailTemplateContent';
import AppVersion from './AppVersion';
import GroceryItems from './Grocery';
import Notification from './Notification';
import UserSession from './UserSession';
import Setting from './Setting';
import Token from './Token';
import Orders from './Order';
import OrderDetails from './OrderDetails';



User.hasOne(UserProfile, {foreignKey: 'userId'});
User.hasOne(UserSetting, {foreignKey: 'userId'});
User.hasOne(Attachment, {foreignKey: 'userId'});
// User.belongsTo(Attachment, {foreignKey: 'imageId'});
User.hasMany(UserAccount, {foreignKey: "userId"});
User.hasMany(UserAccount, {foreignKey: "userId", as: 'userAccounts'});
User.belongsToMany(Role, { through: "user_roles", foreignKey: "userId",otherKey: "roleId"});


UserProfile.hasOne(UserProfile, {foreignKey: "userId",onDelete: "cascade", hooks: true}),
UserProfile.belongsTo(User, {foreignKey: 'userId'});
UserProfile.belongsTo(Attachment, {foreignKey: "imageId",as:'profileImage'});

UserSetting.belongsTo(User, {foreignKey: "userId"});
Attachment.belongsTo(User,{foreignKey:"userId"});

UserAccount.belongsTo(User, {foreignKey: "userId"});
UserAccount.belongsTo(User, {foreignKey: "userId"});


Role.belongsToMany(User, { through: "user_roles",foreignKey: "roleId",otherKey: "userId" });
Role.belongsToMany(Permission, { through: "role_permissions",foreignKey: "roleId",otherKey: "permissionId" });
Role.hasMany(RoleContent, {foreignKey: "roleId",onDelete: 'cascade', hooks:true});
Role.hasOne(RoleContent,{foreignKey:'roleId',as:'content'})
Role.hasOne(RoleContent,{foreignKey:'roleId',as:'defaultContent'}),
Role.belongsTo(User,{foreignKey:'userId',as:'author'});
Role.belongsTo(User,{foreignKey:'lastUpdatedBy',as:'updatedBy'});

RoleContent.belongsTo(Role, { foreignKey: "roleId"});
RoleContent.belongsTo(Language, { foreignKey: "languageId"});

Permission.belongsToMany(Role, { through: "role_permissions", foreignKey: "permissionId", otherKey: "roleId" });
Permission.hasMany(PermissionContent,{foreignKey:'permissionId'})
Permission.hasOne(PermissionContent,{foreignKey:'permissionId',as:'content'})
Permission.hasOne(PermissionContent,{foreignKey:'permissionId',as:'defaultContent'})
Permission.belongsTo(Category,{foreignKey:'categoryId',as:'category'});
Permission.belongsTo(User,{foreignKey:'userId',as:'author'});
Permission.belongsTo(User,{foreignKey:'lastUpdatedBy',as:'updatedBy'});

PermissionContent.belongsTo(PermissionContent, { foreignKey: "permissionId"});
PermissionContent.belongsTo(Language, { foreignKey: "languageId"});

Category.hasMany(CategoryContent, {foreignKey: "categoryId",onDelete: 'cascade', hooks:true});
Category.hasOne(CategoryContent,{foreignKey:'categoryId',as:'content'});
Category.hasOne(CategoryContent,{foreignKey:'categoryId',as:'defaultContent'});
Category.belongsTo(CategoryType, {foreignKey: "categorytypeId",as:'categorytype'});
Category.belongsTo(Attachment,{foreignKey:'imageId',as:"categoryImage"})
Category.belongsTo(User,{foreignKey:'userId',as:'author'});
Category.belongsTo(User,{foreignKey:'lastUpdatedBy',as:'updatedBy'});
Category.belongsTo(Category,{foreignKey:'parentId',as:'parent'}),
Category.hasMany(Category, {foreignKey: "parentId",onDelete: 'cascade', hooks:true,as:'children'});
Category.hasMany(PermissionContent, {foreignKey: "categoryId",onDelete: 'cascade', hooks:true});

CategoryContent.belongsTo(Category, {foreignKey: "categoryId"});
CategoryContent.belongsTo(Language, { foreignKey: "languageId"});

CategoryType.hasMany(CategoryTypeContent, {foreignKey: "categorytypeId",onDelete: 'cascade', hooks:true})
CategoryType.hasOne(CategoryTypeContent,{foreignKey:'categorytypeId',as:'content'})
CategoryType.hasOne(CategoryTypeContent,{foreignKey:'categorytypeId',as:'defaultContent'})
CategoryType.belongsTo(User,{foreignKey:'userId',as:'author'})
CategoryType.belongsTo(User,{foreignKey:'lastUpdatedBy',as:'updatedBy'});

CategoryTypeContent.belongsTo(CategoryType, {foreignKey: "categorytypeId"});
CategoryTypeContent.belongsTo(Language, { foreignKey: "languageId"});


// Language.belongsTo(CategoryTypeContent, { foreignKey: "languageId" });

Email.belongsTo(EmailTemplate, { foreignKey: "EmailTemplateId"});
Email.belongsTo(User, { foreignKey: "userId"});

EmailTemplate.hasMany(EmailTemplateContent, { foreignKey: "EmailTemplateId", onDelete: 'cascade',hooks:true});
EmailTemplate.hasMany(EmailTemplateContent, { foreignKey: "EmailTemplateId", onDelete: 'cascade', hooks:true, as:"content"});
EmailTemplate.hasMany(EmailTemplateContent, { foreignKey: "EmailTemplateId", onDelete: 'cascade', hooks:true, as:"defaultContent" });


EmailTemplateContent.belongsTo(EmailTemplate, { foreignKey: "EmailTemplateId"});
EmailTemplateContent.belongsTo(Language, { foreignKey: "languageId"});
EmailTemplateContent.belongsTo(EmailTemplate, { foreignKey: "EmailTemplateId"});
EmailTemplateContent.belongsTo(Language, { foreignKey: "languageId"}); 


GroceryItems.hasMany(GroceryItems, {foreignKey: "parentId", as: "variants"}); // Parent → Variants
GroceryItems.belongsTo(GroceryItems, {foreignKey: "parentId", as: "parent" }) // Variant → Parent


// Orders has many OrderDetails
Orders.hasMany(OrderDetails, { foreignKey: "orderId", as: "orderDetails" });
OrderDetails.belongsTo(Orders, { foreignKey: "orderId", as: "order" });

// OrderDetails has one GroceryItem (or belongs to if each detail refers to a single item)
OrderDetails.belongsTo(GroceryItems, { foreignKey: "itemId", as: "groceryItems" });
GroceryItems.hasMany(OrderDetails, { foreignKey: "itemId", as: "orderDetails" });


let Models={
    User,
    UserProfile,
    UserSetting,
    UserAccount,
    Attachment,
    Role,
    RoleContent,
    Email,
    EmailTemplate,
    EmailTemplateContent,
    Language,
    Category,
    CategoryContent,
    CategoryType,
    CategoryTypeContent,
    AppVersion,
    Notification,
    UserSession,
    Setting, 
    Permission,
    PermissionContent,
    Token,
    GroceryItems,
    Orders,
    OrderDetails

}

export {Models,Sequelize, sequelize };



