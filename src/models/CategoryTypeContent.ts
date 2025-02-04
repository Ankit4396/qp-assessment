"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {CategoryTypeContentInterface} from '../config/interfaces'

interface CategoryTypeContentInstance extends Model<CategoryTypeContentInterface >,CategoryTypeContentInterface {}
const CategoryTypeContent = sequelize.define<CategoryTypeContentInstance>(
        "CategoryTypeContent",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            categorytypeId:{ type: DataTypes.INTEGER, allowNull: false,unique:'category-type-name',comment: "Ref to category content table"},
            languageId: { type: DataTypes.INTEGER, allowNull: false,unique:'category-type-name', comment: "language for which content has been created"},
            name: { type: DataTypes.TEXT, allowNull: false,comment: "Name of the categorytype" },
            description: { type: DataTypes.TEXT, allowNull: false, comment: "description for category type in HTML format" },
            descriptionText: { type: DataTypes.TEXT, allowNull: false, comment: "description for category type in plain text format" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "categories_types_content",
            indexes:[
                {name:'ref-category-content',fields:['categorytype_id']},
                {name: 'name', fields: ['name','description'],type: 'FULLTEXT'},
                {name: 'language', fields: ['language_id']},
            ]
        }
    );
    export default CategoryTypeContent;

  
