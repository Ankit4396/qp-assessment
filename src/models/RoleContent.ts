"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';

interface RoleContent{
    id: number;
    roleId: number;
    languageId:number;
    name:string;
 
}

interface RoleContentInstance extends Model<RoleContent>,RoleContent{}
    const RoleContent = sequelize.define<RoleContentInstance>(
        "RoleContent",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            roleId:{ type: DataTypes.INTEGER, unique:'role-name',allowNull: false,comment: "Ref to role table"},
            languageId: { type: DataTypes.INTEGER, allowNull: false, unique:'role-name',comment: "language for which content has been created"},
            name: { type: DataTypes.STRING, allowNull: false, unique:'role-name',comment: "Name of the role" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "roles_content",
            indexes:[
                {name:'ref-role-content',fields:['role_id']},
                {name: 'name', fields: ['name']},
                {name: 'name_language', fields: ['language_id','name']},
            ]
        }
    );
    export default RoleContent;
