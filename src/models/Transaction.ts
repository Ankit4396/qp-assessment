// {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//         allowNull: false
//     },
//     paymentId: {type:DataTypes.STRING, allowNull: false, comment: 'payment id from payment gateway'},
//     transactionData: {type: DataTypes.JSON, allowNull: true, comment: 'Meta data for task'},
//     status: { type: DataTypes.STRING, allowNull:false, comment: "captured" },
// },
// {
//     paranoid: true,
//     underscored: true,
//     tableName: "transactions",
//     indexes:[

//     ]
// }

"use strict";
import { sequelize } from '.';
import { Model, Optional, DataTypes } from 'sequelize';
import { TransactionInterface } from '../config/interfaces';


interface TransactionInstance extends Model<TransactionInterface>, TransactionInterface{}
    const Transaction = sequelize.define<TransactionInstance>(
        "Transaction",
       {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    paymentId: {type:DataTypes.STRING, allowNull: false, comment: 'payment id from payment gateway'},
    transactionData: {type: DataTypes.JSON, allowNull: true, comment: 'Meta data for task'},
    status: { type: DataTypes.STRING, allowNull:false, comment: "captured" },
},
{
    paranoid: true,
    underscored: true,
    tableName: "transactions",
    indexes:[

    ]
}
    );

    export default Transaction;
