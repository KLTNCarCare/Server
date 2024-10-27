const validator = require("validator");
const {
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
  getCatalogActiveByRangeDate,
  getAllPriceCurrent,
  updatePriceCatalog,
  updateStatusPriceCatalog,
} = require("../services/price_catalog.service");
const { findAllServiceToPick } = require("../services/service.service");
const createPriceCatalog = async (req, res) => {
  const priceCatalog = req.body;
  const result = await createCatalog(priceCatalog);
  return res.status(result.code).json(result);
};
const editPriceCatalog = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await updatePriceCatalog(id, data);
  return res.status(result.code).json(result);
};
const updateEndDatePriceCatalog = async (req, res) => {
  const id = req.params.id;
  const newDate = req.body.endDate;
  const result = await updateEndDate(id, newDate);
  return res.status(result.code).json(result);
};
const activePriceCatalog = async (req, res) => {
  const id = req.params.id;
  const result = await activeCatalog(id);
  return res.status(result.code).json(result);
};
const inactivePriceCatalog = async (req, res) => {
  const id = req.params.id;
  const result = await inactiveCatalog(id);
  return res.status(result.code).json(result);
};

const delelePriceCatalog = async (req, res) => {
  const id = req.params.id;
  const result = await deleteCatalog(id);
  return res.status(result.code).json(result);
};
const getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await getAllCatalog(page, limit, field, word);
  return res.status(result.code).json(result);
};
const getCurrent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const catalogs = await getActiveCurrentDate(page, limit);
    return res.status(200).json(catalogs);
  } catch (error) {
    console.log("Error in getCurrentCatalog", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const getActive = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const catalogs = await getActiveCatalog(page, limit, field, word);
    return res.status(200).json(catalogs);
  } catch (error) {
    console.log("Error in getActiveCatalog", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const getPriceCurrent = async (req, res) => {
  const textSearch = req.query.searchText || "";
  // const result = await getAllPriceCurrent(textSearch);
  const result = await findAllServiceToPick();
  return res.status(result.code).json(result);
};
const changeStatusPriceCatalog = async (req, res) => {
  const id = req.params.id;
  const result = await updateStatusPriceCatalog(id);
  return res.status(result.code).json(result);
};
module.exports = {
  createPriceCatalog,
  editPriceCatalog,
  updateEndDatePriceCatalog,
  activePriceCatalog,
  inactivePriceCatalog,
  delelePriceCatalog,
  getAll,
  getCurrent,
  getActive,
  getPriceCurrent,
  changeStatusPriceCatalog,
};
