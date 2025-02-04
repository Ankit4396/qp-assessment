"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import { Permission } from '../config/interfaces';




interface PermissionInstance extends Model<Permission>,Permission{}
    const Permission = sequelize.define<PermissionInstance>(
        "Permission",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor of the role"},
            accountId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor account id"},
            lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Last user who has updated the record"},
            code: { type: DataTypes.STRING, allowNull: false, unique:'permissioncode',comment: "Unique code for permission created, generated from title"},
            adminOnly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If permission can be managed by system admin only? 0=>Account admin can manage it for subaccount, 1=> Its exclusive for system admin only"},
            isRevision: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue:false,comment: "Revision of updates"},
            revisionId:{ type: DataTypes.INTEGER, defaultValue: null, comment: "ref to entity, If its a revision" },
            status: { type: DataTypes.INTEGER, defaultValue: 0, comment: "Status of permission. 0-> Inactive, 1-> Active" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "permissions",
            indexes:[
                {name: 'code', fields: ['code']},
            ]
        }
    );

    export default Permission;
