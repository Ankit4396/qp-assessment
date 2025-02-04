"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';

interface SystemEmail{
    id?: number;
    from:string;
    to:string;
    subject:string;
    htmlContent:string;
    textContent:string ;
    type:string
 
}

interface SystemEmailInstance extends Model<SystemEmail>,SystemEmail{}
    const SystemEmail = sequelize.define<SystemEmailInstance>(
        "SystemEmail",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            from: { type: DataTypes.STRING, allowNull: false,comment: "Email is sent from"},
            to: { type: DataTypes.STRING, allowNull: false,comment: "Email is sent to"},
            subject: { type: DataTypes.TEXT, allowNull: false,comment: "Subject of email"},
            htmlContent: { type: DataTypes.TEXT, allowNull: false,comment: "HTML content of email"},
            textContent: { type: DataTypes.TEXT, allowNull: false,comment: "Text of email"},
            type: { type: DataTypes.STRING, allowNull: false,comment: "Type of email"}
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "System_emails",
            indexes:[]
        }
    );


export default  SystemEmail