"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
import { ContactUs } from '../config/interfaces';


interface ContactUsIntance extends Model<ContactUs>,ContactUs{}
    const ContactUs = sequelize.define<ContactUsIntance>(
        "ContactUs",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            email: { type: DataTypes.STRING,allowNull:true,comment: "Email ID for which token is valid" },
            countryCode: { type: DataTypes.STRING,allowNull:true,comment: "Country code" },
            mobile: { type: DataTypes.STRING,allowNull:true,comment: "Mobile No" },
            partnershipEmail:{type:DataTypes.STRING,allowNull:true,comment:"partnership email"},
            officeAddress:{type:DataTypes.STRING,allowNull:true,comment:"office address"},
            facebook:{type:DataTypes.STRING,allowNull:true,comment:"facebook url"},
            instagram:{type:DataTypes.STRING,allowNull:true,comment:"instagram url"},
            twitter:{type:DataTypes.STRING,allowNull:true,comment:"twitter url"},
            metaData:{type:DataTypes.JSON,allowNull:true,defaultValue:null,comment:"{}"}
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "contact_us",
            indexes:[
                {
                    name: 'idx_author_id',
                    fields: ['id']
                }
            ]
        }
    );

    export default ContactUs;