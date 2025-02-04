"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {GeneralSettings} from '../config/interfaces'


interface GeneralSettingsInstance extends Model<GeneralSettings>,GeneralSettings{}
    const GeneralSettings = sequelize.define<GeneralSettingsInstance>(
        "GeneralSettings",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: { type: DataTypes.INTEGER, allowNull: false,comment: "User's ref id" },
            hotelCommissionRate:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"commission rate"},
            flightCommissionRate:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"commission rate"},
            tourGuideCommissionRate:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"commission rate"},
            activitiesCommissionRate:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"commission rate"},
            isRevision:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:0,comment:"is revision"},
            lastUpdatedBy:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"lastUpdatedBy"},
            revisionId:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"revision of"}


        },
        {
            paranoid: true,
            underscored: true,
            tableName: "general_settings",
            indexes:[
                
            ]
        }
    );
   
    export default  GeneralSettings;
