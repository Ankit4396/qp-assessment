"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {UserProfileInterface} from '../config/interfaces'



interface UserProfileInstance extends Model<UserProfileInterface>,UserProfileInterface{}

const UserProfile = sequelize.define<UserProfileInstance>(
    "UserProfile",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        userId: { type: DataTypes.INTEGER, allowNull: false, unique:'user-profile',comment: "User's ref id" },
        name: { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "User's  name"},
        imageId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "User's Profile image"},
        gender: { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "User's gender"},
        stateId : { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "User's state id"},
        stateName: { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "User's state name"},
        pin : { type: DataTypes.STRING, allowNull: true, defaultValue:null,comment: "User's pin"},
        address1 : { type: DataTypes.TEXT, allowNull: true, defaultValue:null,comment: "User's address1"},
        address2 : { type: DataTypes.TEXT, allowNull: true, defaultValue:null,comment: "User's address2"},
        address3 : { type: DataTypes.TEXT, allowNull: true, defaultValue:null,comment: "User's address3"},
        occupation : {type: DataTypes.STRING, allowNull:true, defaultValue:null, comment:"User occupation"}
    },
    {
        paranoid: true,
        underscored: true,
        tableName: "users_profile",
        indexes:[
            
        ]
    }
);
export default UserProfile;