"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {CategoryTypeInterface} from '../config/interfaces'

interface CategoryTypeInstance extends Model<CategoryTypeInterface>,CategoryTypeInterface{}
const CategoryType = sequelize.define<CategoryTypeInstance>(
        "CategoryType",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            code: { type: DataTypes.STRING, allowNull: false, unique:'category-type-code',comment: "unique code for categoryType created, generated from title"},
            userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor of the record"},
            lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Last user who has updated the record"},
            isRevision: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue:false,comment: "If redord is revision?"},
            revisionId:{ type: DataTypes.INTEGER, defaultValue: null, comment: "ref to entity, If its a revision" },
            status: { type: DataTypes.INTEGER, defaultValue: 1, comment: "Status of CategoryType. 0-> Inactive, 1-> Active" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "categories_types",
            indexes:[
                {name: 'id-revision', fields: ['id','is_revision']},
            ]
        }
    );


    export default CategoryType;
   
   
