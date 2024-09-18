
const validator = require('validator');
const { createCatalog } = require('../services/price_catalog.service');

const createPriceCatalog = async (req, res) => {
    // check null values
    const{priceName,startDate,endDate,items}=req.body;
    if(!priceName || !startDate || !endDate || !items){
        return res.status(400).json({message:"All fields are required"});
    }
    // check date format
    if(!validator.isISO8601(startDate) && !validator.isISO8601(endDate)){
        return res.status(400).json({message:"Invalid date format"});
    }
    // check date range
    if( Date.now() > new Date(startDate) || new Date(startDate) > new Date(endDate)){
        return res.status(400).json({message:"Invalid date range"});
    }
    // check items
    items.forEach(item=>{
        if(!item.itemId || !item.itemName || !item.price){
            return res.status(400).json({message:"All fields are required"});
        }
    });
    // create price catalog
    const priceCatalog ={
        priceName,
        startDate,
        endDate,
        items
    };

    const result = await createCatalog(priceCatalog);
    if(!result){
        return res.status(500).json({message:"Internal server error"});
    }
    return res.status(201).json(result);
}
module.exports = {
    createPriceCatalog
};