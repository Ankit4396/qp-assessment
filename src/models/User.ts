"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import UserProfile from "./UserProfile"
import {UserInterface} from '../config/interfaces'


interface UserInstance extends Model<UserInterface>,UserInterface{
    setRoles(arg0: number[], arg1: { transaction: import("sequelize").Transaction; }): unknown;
    addRole(arg0: number[], arg1: { transaction: import("sequelize").Transaction; }): unknown;
  }


const User = sequelize.define<UserInstance>(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        imageId:{ type:DataTypes.INTEGER, allowNull:true,defaultValue:null,comment:"User Profile Image Id" },
        email: { type: DataTypes.STRING, allowNull: true,defaultValue:null, unique:'email',comment: "User's Email id" },
        countryCode: { type: DataTypes.STRING, allowNull: true,defaultValue:null, unique:'mobile',comment: "Country code" },
        mobile: { type: DataTypes.STRING, allowNull: true, defaultValue:null, unique:'mobile',comment: "User's mobile no"},
        password: { type: DataTypes.STRING, allowNull: true,comment: "Encrypted user password"},
        secret: { type: DataTypes.TEXT, allowNull:true, comment: "2FA Secret of user" },
        fcmToken:{ type: DataTypes.STRING, allowNull: true, comment: "FCM Token for Push Notification"},
        signUpSource : { type: DataTypes.INTEGER, allowNull: true, defaultValue: null, comment: "Source of signup (web,android,ios)" },
        socialPlatform: { type: DataTypes.TEXT, allowNull:true, comment: "social platform used for signup (google,apple)" },
        socialPlatformId: { type: DataTypes.TEXT, allowNull:true, comment: "social platform user identifier" },
        googleIdentifier: { type: DataTypes.TEXT, allowNull:true, comment: "social platform identifier used for signup using google" },
        appleIdentifier: { type: DataTypes.TEXT, allowNull:true, comment: "social platform identifier used for signup using apple" },
        status: { type: DataTypes.INTEGER, defaultValue: 0, comment: "Status of user. 0-> Inactive, 1-> Active" },
        lastLocation: { type: DataTypes.JSON, defaultValue: null, allowNull: true, comment: "Last location of the user" },
        onlineStatus: { type: DataTypes.INTEGER, defaultValue: 0, comment: "0-> Offline, 1-> Online" }
    },
    {
        paranoid: true,
        underscored: true,
        tableName: "users",
        indexes:[
            
        ]
    }
);
export default User;