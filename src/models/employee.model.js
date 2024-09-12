const mongoose = require('mongoose');
const { personIdRegex } = require('../utils/regex');

const employeeSchema= mongoose.Schema({
    empId:{
        type: String,
        required: true,
        unique:true
    },
    fullName:{
        type:String,
        required: true
    },
    phoneNumber:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: false,
        default: null
    },
    address:{
        type: String,
        required: false,
        default: null
    },
    dob:{
        type: Date,
        required: false,
        default:null
    },
    personId:{
        type: String,
        required: true,
        match:[personIdRegex, 'PersonId must be a string of 13 digits']
    },
    status:{
        type: String,
        enum:["active","inactive"],
        default: "active"
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;