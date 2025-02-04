"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {OrderInterface} from '../config/interfaces'

interface OrderInstance extends Model<OrderInterface>,OrderInterface{}
    const Orders = sequelize.define<OrderInstance>(
        "Orders",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            customerId: { type: DataTypes.INTEGER, allowNull: false,comment: "user id" },
            cartTotalValue:{type:DataTypes.INTEGER, allowNull: false,comment:"cart total value"},
            cartFinalValue:{type:DataTypes.INTEGER, allowNull: false,defaultValue:0,comment:"cart final value"},
            totalDiscount:{type:DataTypes.INTEGER, allowNull: true,defaultValue:0,comment:"total Discount"},
            deliveryCharge:{type:DataTypes.INTEGER, allowNull: true,defaultValue:0,comment:"delivery Charge"},
            address:{type:DataTypes.TEXT,allowNull:true,defaultValue:null,comment:"address"},
            modeOfPayment:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"mode Of Payment"},
            isPaid:{type:DataTypes.INTEGER, allowNull: false,defaultValue:1,comment:"isPaid"},
            deliveryStatus:{type:DataTypes.INTEGER, allowNull: true,defaultValue:false,comment:"deliveryStatus"},
            transactionId:{type:DataTypes.INTEGER, allowNull: true,defaultValue:null,comment:"transactionId"},
            transactionStatus:{type:DataTypes.INTEGER, allowNull: true,defaultValue:null,comment:"transactionStatus"},
            deliveredAt:{type:DataTypes.DATE, allowNull:true,defaultValue:null,comment:"deliveredAt"},
            deliverEstimateTime:{type:DataTypes.INTEGER, allowNull:false,defaultValue:false,comment:"deliverEstimateTime"},
            status:{type:DataTypes.INTEGER,allowNull:true,defaultValue:null,comment:"status"},

        },
        {
            paranoid: true,
            underscored: true,
            tableName: "orders",
            indexes:[
                
            ]
        }
    );
   
    export default  Orders;
