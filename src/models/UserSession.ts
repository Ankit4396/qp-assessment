"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {UserSessionInterface} from '../config/interfaces';


interface UserSessionInstance extends Model<UserSessionInterface>,UserSessionInterface{
}

const UserSession = sequelize.define<UserSessionInstance>(
    "UserSession",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false,comment: ""},
        deviceToken: { type: DataTypes.TEXT, allowNull: false,comment: ""},
        deviceType: { type: DataTypes.INTEGER, allowNull: true,comment: ""},
        status: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false,comment: ""}
    },
    {
        paranoid: true,
        underscored: true,
        tableName: "user_sessions",
        indexes:[]
    }
);
export default UserSession;