const PriceCatalog = require("../models/priceCatalog.model");
const { generateID } = require("../services/lastID.service");
const createCatalog = async (priceCatalog) => {
  priceCatalog.priceId = await generateID("BG");
  return await PriceCatalog.create(priceCatalog);
};
const updateEndDate = async (id, newDate) =>
  await PriceCatalog.findOneAndUpdate(
    { _id: id },
    { endDate: newDate },
    { new: true }
  );

const activeCatalog = async (id) =>
  await PriceCatalog.findOneAndUpdate(id, { status: "active" }, { new: true });
const inactiveCatalog = async (id) =>
  await PriceCatalog.findOneAndUpdate(
    id,
    { status: "inactive" },
    { new: true }
  );
const deleteCatalog = async (id) =>
  await PriceCatalog.findOneAndUpdate(id, { status: "deleted" }, { new: true });

const getCatalogActiveByDate = async (date) =>
  await PriceCatalog.find({
    startDate: { $lte: date },
    endDate: { $gte: date },
    status: "active",
  });

const getCatalogById = async (id) => await PriceCatalog.findById(id);
// get catalog with active status and current date
const getActiveCurrentDate = async (page, limit) =>
  await PriceCatalog.find({
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  })
    .skip((page - 1) * limit)
    .limit(limit);
//get catalog with active status
const getActiveCatalog = async (page, limit) =>
  await PriceCatalog.find({ status: "active" })
    .skip((page - 1) * limit)
    .limit(limit);
// get all catalog with active, inactive status
const getAllCatalog = async (page, limit) =>
  await PriceCatalog.find({ status: { $ne: "deleted" } })
    .skip((page - 1) * limit)
    .limit(limit);
const getTotalPage = async (limit) => {
  const total = await PriceCatalog.countDocuments({
    status: { $ne: "deleted" },
  });
  return Math.ceil(total / limit);
};
module.exports = {
  createCatalog,
  getCatalogById,
  updateEndDate,
  getCatalogActiveByDate,
  activeCatalog,
  deleteCatalog,
  inactiveCatalog,
  getAllCatalog,
  getActiveCurrentDate,
  getActiveCatalog,
  getTotalPage,
};
