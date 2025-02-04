"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import { RoleInterface } from '../config/interfaces';

interface RoleInstance extends Model<RoleInterface>,RoleInterface{
    setPermissions(arg0: number[], arg1: { transaction: import("sequelize").Transaction; }): unknown;
}
interface RoleInstance extends Model<RoleInterface>,RoleInterface{}
    const Role = sequelize.define<RoleInstance>(
        "Role",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            code: { type: DataTypes.STRING, allowNull: false, unique:'rolecode', defaultValue:"user",comment: "unique code for role created, generated from title"},
            userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor of role, null means system default"},
            lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Last user who has updated the record"},
            accountId:{ type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Account for which role has been created"},
            isRevision: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue:false,comment: "Revision of updates"},
            revisionId:{ type: DataTypes.INTEGER, defaultValue: null, comment: "ref to entity, If its a revision" },
            isDefault:{type:DataTypes.BOOLEAN,allowNull:true,defaultValue:null,comment: "If role is default or not"},
            status: { type: DataTypes.INTEGER, defaultValue: 0, comment: "Status of role. 0-> Inactive, 1-> Active" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "roles",
            indexes:[
                {name: 'code', fields: ['code']},
            ]
        }
    );
  
    export default Role;
