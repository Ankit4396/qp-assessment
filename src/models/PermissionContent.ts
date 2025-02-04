"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';

import { PermissionContent } from '../config/interfaces';

interface PermissionContentInstance extends Model<PermissionContent>,PermissionContent{}

    const PermissionContent = sequelize.define<PermissionContentInstance>(
        "PermissionContent",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            permissionId:{ type: DataTypes.INTEGER, allowNull: false,comment: "Ref to permission table"},
            languageId: { type: DataTypes.INTEGER, allowNull: false, comment: "language for which content has been created"},
            name: { type: DataTypes.TEXT, allowNull: false,comment: "Name of the permission" },
            description: { type: DataTypes.TEXT, allowNull: true,comment: "Small description about the permission" }
            
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "permissions_content",
            indexes:[
                {name:'ref-permission-content',fields:['permission_id']},
                {name: 'name', fields: ['name'],type: 'FULLTEXT'},
                {name: 'language', fields: ['language_id']},
            ]
        }
    );
    export default PermissionContent;

