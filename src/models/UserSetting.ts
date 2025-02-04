"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {UserSetting} from '../config/interfaces'


interface UserSettingInstance extends Model<UserSetting>,UserSetting{}
    const UserSetting = sequelize.define<UserSettingInstance>(
        "UserSetting",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: { type: DataTypes.INTEGER, allowNull: false, unique:'user-identity',comment: "User's ref id" },
            twoFactorAuthentication: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:true,comment: "Enable two factor authentication"},
            skipSubscriptionPage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If user has skipped subscription option"},
            skipDashboardTour: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If dashboard tour has been skipped"},
            hasUniversalNominee: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If user has created a universal nominee"},
            kycStatus: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If user has completed KYC"},
            // distanceUnit:{type:DataTypes.ENUM,values:Object.values(DistanceUnit),allowNull:false,comment:"distance unit for delivery charges"}
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "users_settings",
            indexes:[
                
            ]
        }
    );
   
    export default UserSetting;
