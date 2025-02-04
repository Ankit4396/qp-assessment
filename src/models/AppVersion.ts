"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {AppVersionInterface} from '../config/interfaces'



interface AppVersionInstance extends Model<AppVersionInterface>,AppVersionInterface{}

const AppVersion = sequelize.define<AppVersionInstance>(
    "AppVersion",
    {
        id: {
            
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ios_soft_update: { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "IOS software update"},
        ios_critical_update: { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "IOS Critical update"},
        android_soft_update: { type: DataTypes.FLOAT, allowNull: true, defaultValue:null,comment: "Android Software Update "},
        android_critical_update: { type: DataTypes.FLOAT, allowNull:true, defaultValue:null,comment:"Android Critical Update"}

    },
    { 
        paranoid: true,
        underscored: true,
        tableName: "app_version",
        indexes:[
            
        ]
    }
);
export default AppVersion;