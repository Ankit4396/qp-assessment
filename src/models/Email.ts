"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';

import * as Interface from '../config/interfaces'


interface Email{
    id: number;
    userId: number;
    accountId:number;
    isRevision:boolean;
    revisionId:number;
    EmailTemplateId:number;
    status:number;
}
interface EmailInstance extends Model<Email>,Email{}

let Email = sequelize.define<EmailInstance>(
    "Email",
    {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor of the record"},
    accountId: { type: DataTypes.INTEGER, allowNull: true, defaultValue:null,comment: "Aurthor account id"},
    isRevision: { type: DataTypes.BOOLEAN, allowNull: false,defaultValue:false,comment: "If redord is revision?"},
    revisionId:{ type: DataTypes.INTEGER, defaultValue: null, comment: "ref to entity, If its a revision" },
    EmailTemplateId: { type: DataTypes.INTEGER,allowNull:false},
    status: { type: DataTypes.INTEGER, defaultValue: 1, comment: "Status of email. 0-> Inactive, 1-> Active" }
    },
    {
    paranoid: true,
    underscored: true,
    tableName: "emails"
    }
);
export default Email;
    // Email.associate = function(models) {
    //     Email.belongsTo(models.EmailTemplate, { foreignKey: "EmailTemplateId"});
    //     Email.belongsTo(models.User, { foreignKey: "userId"});
    // };
//     return Email;
// }; 