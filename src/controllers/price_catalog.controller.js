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
} = require("../services/price_catalog.service");
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
  try {
    const id = req.params.id;
    const newDate = req.body.endDate;

    // check null values
    if (!id || !newDate) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // check date format
    if (!validator.isISO8601(newDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    // check price catalog id
    const catalog = await getCatalogById(id);
    if (!catalog) {
      return res.status(404).json({ message: "Price catalog not found" });
    }
    // check date range
    const startDate = new Date(catalog.startDate);
    const oldEndDate = new Date(catalog.endDate);
    const newEndDate = new Date(newDate);
    const now = new Date();
    if (newEndDate <= startDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }
    if (newEndDate > oldEndDate) {
      return res.status(400).json({
        message: "Chỉ có thể sửa ngày kết thúc mới nhỏ hơn ngày kết thúc cũ",
      });
    }

    // update end date
    const result = await updateEndDate(id, newDate);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    log("Error in updateEndDate", error);
  }
};

const activePriceCatalog = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const catalog = await getCatalogById(id);
    if (!catalog) {
      return res.status(404).json({ message: "Price catalog not found" });
    }
    const items_active = catalog.items.map((item) => item.itemId);

    //get  list catalog active by date
    const ls = await getCatalogActiveByRangeDate(
      new Date(catalog.startDate),
      new Date(catalog.endDate)
    );
    //check item exist in another catalog
    if (ls.length > 0) {
      for (let catalog of ls) {
        const check = catalog.items.some((item) =>
          items_active.includes(item.itemId)
        );
        if (check) {
          return res.status(400).json({
            message: "Have Item is already in catalog: " + catalog.priceId,
          });
        }
      }
    }
    const result = await activeCatalog(id);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in activePriceCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const inactivePriceCatalog = async (req, res) => {
  const id = req.params.id;
  //check value id
  if (!id) {
    return res.status(400).json({ message: "All fields are required" });
  }
  //find catalog by id
  const catalog = await getCatalogById(id);
  if (!catalog) {
    return res.status(404).json({ message: "Price catalog not found" });
  }
  //check catalog is used
  const startDate = new Date(catalog.startDate);
  const endDate = new Date(catalog.endDate);
  if (
    catalog.status === "active" &&
    startDate <= Date.now() &&
    endDate >= Date.now()
  ) {
    return res
      .status(400)
      .json({ message: "Don't inactive price catalog is used!" });
  }
  //inactive price catalog
  const result = await inactiveCatalog(id);
  if (!result) {
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(200).json(result);
};

const delelePriceCatalog = async (req, res) => {
  try {
    const id = req.params.id;
    // check null values
    if (!id) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // check price catalog id
    const catalog = await getCatalogById(id);
    if (!catalog) {
      return res.status(404).json({ message: "Price catalog not found" });
    }
    // check price catalog is used
    const startDate = new Date(catalog.startDate);
    const endDate = new Date(catalog.endDate);
    if (
      catalog.status === "active" &&
      startDate <= Date.now() &&
      endDate >= Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Don't delete price catalog is used!" });
    }
    // delete price catalog
    const result = await deleteCatalog(id);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in deletePriceCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPage = await getTotalPage(limit);
    const data = await getAllCatalog(page, limit);
    return res.status(200).json({ data, totalPage });
  } catch (error) {
    console.log("Error in getAllCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getCurrent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const catalogs = await getActiveCurrentDate(page, limit);
    return res.status(200).json(catalogs);
  } catch (error) {
    console.log("Error in getCurrentCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getActive = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const catalogs = await getActiveCatalog(page, limit);
    return res.status(200).json(catalogs);
  } catch (error) {
    console.log("Error in getActiveCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getPriceCurrent = async (req, res) => {
  const textSearch = req.query.searchText || "";
  const result = await getAllPriceCurrent(textSearch);
  return res
    .status(result.code)
    .json({ message: result.message, data: result.data });
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
};
