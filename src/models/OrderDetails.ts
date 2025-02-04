"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {OrderDetailsInterface} from '../config/interfaces'

interface OrderDetailsInstance extends Model<OrderDetailsInterface>,OrderDetailsInterface{}
    const OrderDetails = sequelize.define<OrderDetailsInstance>(
        "OrderDetails",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            orderId: { type: DataTypes.INTEGER, allowNull: false,comment: "name of item" },
            itemId:{type:DataTypes.INTEGER, allowNull: false,comment:"item id"},
            quantity:{type:DataTypes.INTEGER, allowNull: false,comment:"quantity"},
            totalDiscount:{type:DataTypes.INTEGER, allowNull: true,defaultValue:0,comment:"total discount"},
            finalPrice:{type:DataTypes.INTEGER, allowNull: true,defaultValue:0,comment:"final price"},
            price:{type:DataTypes.INTEGER,allowNull:false,defaultValue:0,comment:"price"},
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "order_details",
            indexes:[
                
            ]
        }
    );
   
    export default  OrderDetails;
