const PriceCatalog = require("../models/priceCatalog.model");
const {generateID} = require("../services/lastID.service");
const createCatalog = async (priceCatalog) => {
    try {
        priceCatalog.priceId = await generateID("BG");
        return await PriceCatalog.create(priceCatalog);

    } catch (error) {
        console.log("Error in createPriceCatalog", error);
        return null;
    }
};
const updateEndDate = async (id,newDate) => {
    try {
        return await PriceCatalog.findByIdAndUpdate(id,{endDate:newDate},{new:true});
    } catch (error) {
        console.log("Error in update endDate Price catalog ", error);
        return null;
    }
};
const activeCatalog = async (id) => {
    try {
        return await PriceCatalog.findByIdAndUpdate(id,{status:"inactive"},{new:true});
    } catch (error) {
        console.log("Error in active Price catalog ", error);
        return null;
    }
};
const deleteCatalog = async (id) => {
    try {
        return await PriceCatalog.findByIdAndUpdate(id,{status:"deleted"},{new:true});
    } catch (error) {
        console.log("Error in delete Price catalog ", error);
        return null;
    }
};
const getCatalogById = async (id) => {
    try {
        return await PriceCatalog.findById(id);
}catch(error){
    console.log("Error in getCatalogById", error);
    return null;
}};
module.exports = {
    createCatalog,
    updateEndDate,
    activeCatalog,
    deleteCatalog,
    getCatalogById
};