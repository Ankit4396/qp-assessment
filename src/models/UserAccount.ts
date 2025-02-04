"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {UserAccount} from '../config/interfaces'


interface UserAccountInstance extends Model<UserAccount>,UserAccount{}
    const UserAccount = sequelize.define<UserAccountInstance>(
        "UserAccount",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: { type: DataTypes.INTEGER, allowNull: false, unique:'user-identity',comment: "User's ref id" },
            accountId: { type: DataTypes.INTEGER, allowNull: true, unique:'user-identity',comment: "User's account id, if null, its a super user account/subaccount" },
            isDefault:{ type: DataTypes.BOOLEAN, allowNull: false,comment: "If account is set as default" },
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "users_accounts",
            indexes:[
                
            ]
        }
    );
   
    export default  UserAccount;
