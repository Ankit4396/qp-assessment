"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {NotificationInterface} from '../config/interfaces'


interface NotificationInstance extends Model<NotificationInterface>,NotificationInterface{}

const Notification = sequelize.define<NotificationInstance>(
    "Notification",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false, comment: "" },
        code: { type: DataTypes.STRING, allowNull: false, comment: "" },
        title: { type: DataTypes.STRING, allowNull: false, comment: "" },
        body: { type: DataTypes.STRING, allowNull: false, comment: "" },
        data: { type: DataTypes.TEXT, allowNull: true, comment: "" },
        isRead: { type: DataTypes.INTEGER, defaultValue: 0, comment: "" },
    },
    {
        paranoid: true,
        underscored: true,
        tableName: "notifications",
        indexes:[]
    }
);
export default Notification;