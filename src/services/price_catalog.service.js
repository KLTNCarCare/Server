const PriceCatalog = require("../models/priceCatalog.model");
const { generateID } = require("../services/lastID.service");
const createCatalog = async (priceCatalog) => {
    priceCatalog.priceId = await generateID("BG");
    return await PriceCatalog.create(priceCatalog);
};
const updateEndDate = async (id, newDate) =>
    await PriceCatalog.findByIdAndUpdate(id, { endDate: newDate }, { new: true });

const activeCatalog = async (id) =>
    await PriceCatalog.findByIdAndUpdate(id, { status: "active" }, { new: true });

const deleteCatalog = async (id) =>
    await PriceCatalog.findByIdAndUpdate(
        id,
        { status: "deleted" },
        { new: true }
    );

const getCatalogActiveByDate = async (date) =>
    await PriceCatalog.find({
        startDate: { $lte: date },
        endDate: { $gte: date },
        status: "active",
    });
const getCatalogById = async (id) => await PriceCatalog.findById(id);
module.exports = {
    createCatalog,
    updateEndDate,
    activeCatalog,
    deleteCatalog,
    getCatalogById,
    getCatalogActiveByDate,
};
