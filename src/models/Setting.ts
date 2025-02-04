"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import { SettingsInterface } from '../config/interfaces';


interface SettingInstance extends Model<SettingsInterface>,SettingsInterface{}
    const Setting = sequelize.define<SettingInstance>(
        "Setting",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            tax: { type: DataTypes.STRING, allowNull: false, defaultValue:"18", comment: "Tax amount"},
            lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Last user who has updated the record"},
            
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "settings",
            indexes:[
                
            ]
        }
    );
  
    export default Setting;
