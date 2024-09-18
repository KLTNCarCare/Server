const mongoose = require("mongoose");
const itemSchema=mongoose.Schema({
    itemId:{
        type:String,
        required:true
    },
    itemName:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true,
        min:0
    },
});
const priceCatalogSchema = mongoose.Schema({
    priceId:{
        type:String,
        required:true,
        unique:true
    },
    priceName:{
        type:String,
        required:true
    },
    startDate:{
        type:Date,
        required:true,
    },
    endDate:{
        type:Date,
        required:true,
    },
    status:{
        type:String,
        enum:["active","inactive","deleted"],
        default:"inactive"

    },
    items:[itemSchema],
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
});
const PriceCatalog = mongoose.model("PriceCatalog",priceCatalogSchema);
module.exports=PriceCatalog;