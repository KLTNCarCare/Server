const mongoose = require('mongoose');
const { phoneNumberRegex } = require('../utils/regex');
    const accountSchema = mongoose.Schema({
        username:{
            type:String,
            match: [phoneNumberRegex, 'Username must be a string of 10 digits'],
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        },
        userId:{
            type:String,
            default:null
        },
        role:{
            type:String,
            enum:["admin","customer","staff"],
            required:true
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
        });

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;