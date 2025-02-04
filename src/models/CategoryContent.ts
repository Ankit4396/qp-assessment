"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {CategoryContentInterface} from '../config/interfaces'

interface CategoryContentInstance extends Model<CategoryContentInterface>,CategoryContentInterface{}


    const CategoryContent = sequelize.define<CategoryContentInstance>(
        "CategoryContent",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            categoryId:{ type: DataTypes.INTEGER, allowNull: false,unique:'category-type-name',comment: "Ref to category content table"},
            languageId: { type: DataTypes.INTEGER, allowNull: false,unique:'category-type-name', comment: "language for which content has been created"},
            name: { type: DataTypes.TEXT, allowNull: false,comment: "Name of the category" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "categories_content",
            indexes:[
                {name:'ref-category-content',fields:['category_id']},
                {name: 'name', fields: ['name'], type: 'FULLTEXT'},
                {name: 'language', fields: ['language_id']},
            ]
        }
    );

   export default CategoryContent;
    
