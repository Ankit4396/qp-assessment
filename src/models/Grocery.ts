"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {GroceryItems} from '../config/interfaces'

interface GroceryItemsInstance extends Model<GroceryItems>,GroceryItems{}
    const GroceryItems = sequelize.define<GroceryItemsInstance>(
        "GroceryItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            name: { type: DataTypes.TEXT, allowNull: false,comment: "name of item" },
            coverImage:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"image"},
            description:{type:DataTypes.TEXT, allowNull: false,defaultValue:0,comment:"description"},
            overview:{type:DataTypes.TEXT, allowNull: false,defaultValue:0,comment:"overview"},
            inStock:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"is in stick flag"},
            leftQuantity:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:0,comment:"total available or quantitiy left in stock"},
            lastUpdatedBy:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"lastUpdatedStock"},
            price:{type:DataTypes.INTEGER, allowNull: false,defaultValue:1,comment:"price"},
            isAnyOfferActive:{type:DataTypes.INTEGER, allowNull: true,defaultValue:false,comment:"is any offer applicable"},
            offerPrice:{type:DataTypes.INTEGER, allowNull: true,defaultValue:null,comment:"offer price if available"},
            discount:{type:DataTypes.INTEGER, allowNull: true,defaultValue:null,comment:"how much discount, if any "},
            status:{type:DataTypes.BOOLEAN, allowNull:false,defaultValue:true,comment:"is active to sell"},
            isParent:{type:DataTypes.BOOLEAN, allowNull:false,defaultValue:true,comment:"is main item or parent item"},
            haveVariant:{type:DataTypes.BOOLEAN, allowNull:false,defaultValue:false,comment:"having variant of this item"},
            isVariant:{type:DataTypes.BOOLEAN, allowNull:false,defaultValue:false,comment:"is this item is variant of any other item"},
            parentId:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"variant of which item, item id"},
            isDefaultVariant:{type:DataTypes.INTEGER, allowNull:false,defaultValue:false,comment:"is this default variant"}

        },
        {
            paranoid: true,
            underscored: true,
            tableName: "grocery_items",
            indexes:[
                
            ]
        }
    );
   
    export default  GroceryItems;
