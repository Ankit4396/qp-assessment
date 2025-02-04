"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import {AttachmentInterface} from '../config/interfaces';




interface AttachmentInstance extends Model<AttachmentInterface>,AttachmentInterface{}
const Attachment = sequelize.define<AttachmentInstance>(
        "Attachment",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            fileName: { type: DataTypes.STRING, allowNull: false,comment: "Original Name of file uploaded to server"},
            userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "User identity who has uploaded the file"},
            accountId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "User`s account id"},
            uniqueName: { type: DataTypes.STRING, allowNull: false,unique:'fileName',comment: "unique filename"},
            extension: { type: DataTypes.STRING, allowNull: false,unique:'fileName',comment: "unique filename"},
            filePath:{ type: DataTypes.TEXT, allowNull: false, comment: "relative path of file on server"},
            type:{type:DataTypes.INTEGER,allowNull:false,defaultValue:1,comment:"1=>Stored in file system, 2=>Stored on S3 bucket"},
            size:{type:DataTypes.INTEGER,allowNull:false,defaultValue:0,comment:"filesize in bytes"},
            dataKey:{ type: DataTypes.TEXT, allowNull:true,defaultValue:null, comment: "datakey for the file" },
            status: { type: DataTypes.INTEGER, defaultValue:0, comment: "Status of file uploaded. 0-> not connected to entity, 1-> Connected to entity" },
            thumbnailId:{ type: DataTypes.INTEGER, allowNull:true, defaultValue:null, comment: "Id of thumbnail" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "attachments",
            indexes:[
                {name: 'unique-name', fields: ['unique_name']},
            ]
        }
    );

    export default Attachment;