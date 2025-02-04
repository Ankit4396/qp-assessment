"use strict";
import { sequelize } from '.';
import { Model, Optional,DataTypes } from 'sequelize';
interface Language{
    id?: number;
    name: String;
    code:String;
    isDefault:number;
    status:number;

}

interface LanguageInstance extends Model<Language>,Language{}
const Language = sequelize.define<LanguageInstance>(
        "Language",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            name: { type: DataTypes.STRING, allowNull: false, unique:'language-name',comment: "Language" },
            code: { type: DataTypes.STRING, allowNull: false, unique:'langiage-code',comment: "unique code for language created, generated from title"},
            isDefault: { type: DataTypes.INTEGER, allowNull: true,comment: "if language is set as default? true, false"},
            status: { type: DataTypes.INTEGER, defaultValue: 0, comment: "Status of language. 0-> Inactive, 1-> Active" }
        },
        {
            paranoid: true,
            underscored: true,
            tableName: "languages",
            indexes:[
                {name: 'language_code', fields: ['name','code']}
            ]
        }
    );
   
    export default Language;
