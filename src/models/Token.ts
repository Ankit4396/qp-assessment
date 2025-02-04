"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import { TokenInterface } from '../config/interfaces';

interface TokenInstance extends Model<TokenInterface>,TokenInterface{}
    let Token = sequelize.define<TokenInstance>(
      "Token",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        type: { type: DataTypes.STRING,allowNull:false,comment: "Event for which token is generated" },
        email: { type: DataTypes.STRING,allowNull:true,comment: "Email ID for which token is valid" },
        countryCode: { type: DataTypes.STRING,allowNull:true,comment: "Country code" },
        mobile: { type: DataTypes.STRING,allowNull:true,comment: "Mobile No" },
        userId: { type: DataTypes.INTEGER,allowNull:true,comment: "User identifier for which token has been generated" },
        accountId: { type: DataTypes.INTEGER,allowNull:true,comment: "User's account identifier for which token has been generated" },
        token: { type: DataTypes.TEXT,allowNull:false,comment: "Generated jwt token" },
        code: {type:DataTypes.STRING,allowNull:true,comment: "Verification code for which tokwn will stand valid" },
        status: { type: DataTypes.INTEGER,defaultValue:1,comment: "Validation status of token, 0->used, 1-> Not Used" },
        verificationsAttempts:{ type: DataTypes.INTEGER,defaultValue:0,comment: "Number of attempts with invalid code to verify token" }
      },
      {
        paranoid: true,
        underscored: true,
        tableName: "tokens",
        indexes:[
          {name: 'account_user', fields: ['account_id','user_id']},
          {name: 'type', fields: ['type','email','user_id']}
        ]
      }
    );
    export default Token;

