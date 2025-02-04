"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {CategoryInterface} from '../config/interfaces'

interface CategoryInstance extends Model<CategoryInterface>,CategoryInterface{}

    const Category = sequelize.define<CategoryInstance>(
        "Category",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            code: { type: DataTypes.STRING, allowNull: false, unique:'category-type-code',comment: "unique code for categorytype created, generated from title"},
            categorytypeId: { type: DataTypes.INTEGER, allowNull: false,unique:'category-type-code',comment: "Type of category"},
            parentId: { type: DataTypes.INTEGER, allowNull: true,defaultValue:null,unique:'category-type-code',comment: "Parent of category"},
            userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,unique:'category-type-code',comment: "Aurthor of the record"},
            accountId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor account identity"},
            adminOnly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue:false,comment: "If Category can be managed by system admin only? 0=>Account admin can manage it for subaccount, 1=> Its exclusive for system admin only"},
            lastUpdatedBy: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Last user who has updated the record"},
            isRevision: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue:false,comment: "If redord is revision?"},
            imageId: { type: DataTypes.INTEGER, allowNull: true,defaultValue:null,comment: "Identity of image associated with category"},
            revisionId:{ type: DataTypes.INTEGER, defaultValue: null, comment: "ref to entity, If its a revision" },
            orderSequence:{ type: DataTypes.TEXT, defaultValue: null, comment: "Order sequence for tree structure" },
            level:{ type: DataTypes.INTEGER, defaultValue: null, comment: "Level of category" },
            status: { type: DataTypes.INTEGER, defaultValue: 1, comment: "Status of Category. 0-> Inactive, 1-> Active" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "categories",
            indexes:[
                {name: 'id-revision', fields: ['id','is_revision']},
            ]
        }
    );

    export default Category;
  
