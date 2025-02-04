"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import * as Interface from '../config/interfaces'
import {EmailTemplate, EmailTemplateContent} from '../config/interfaces'

interface EmailTemplateContentInstance extends Model<Interface.EmailTemplateContent>,EmailTemplateContent{}

    let EmailTemplateContent = sequelize.define<EmailTemplateContentInstance>(
      "EmailTemplateContent",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        EmailTemplateId: { type: DataTypes.INTEGER,allowNull:false,unique:'unique-language-content'},
        languageId:{type: DataTypes.INTEGER,allowNull:false,unique:'unique-language-content'},
        title: { type: DataTypes.TEXT,allowNull:false},
        message: { type: DataTypes.TEXT,allowNull:false},
        messageText: { type: DataTypes.TEXT,allowNull:false},
        subject: { type: DataTypes.TEXT,allowNull:false},
      },
      {
        paranoid: true,
        underscored: true,
        tableName: "emails_template_content",
        indexes:[
            {name: 'name', fields: ['title','message_text'],type: 'FULLTEXT'}
          ]
      }
    );

    export default EmailTemplateContent;