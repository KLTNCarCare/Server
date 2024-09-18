const validator = require("validator");
const {
  createCatalog,
  getCatalogById,
  updateEndDate,
  getCatalogActiveByDate,
  activeCatalog,
  deleteCatalog,
} = require("../services/price_catalog.service");

const createPriceCatalog = async (req, res) => {
  try {
    // check null values
    const { priceName, startDate, endDate, items } = req.body;
    if (!priceName || !startDate || !endDate || !items) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // check date format
    if (!validator.isISO8601(startDate) && !validator.isISO8601(endDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    // check date range
    if (
      Date.now() > new Date(startDate) ||
      new Date(startDate) > new Date(endDate)
    ) {
      return res.status(400).json({ message: "Invalid date range" });
    }
    // check items
    const isNullItem = items.some(
      (item) => !item.itemId || !item.itemName || !item.price
    );
    if (isNullItem) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // create price catalog
    const priceCatalog = {
      priceName,
      startDate,
      endDate,
      items,
    };

    const result = await createCatalog(priceCatalog);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in createPriceCatalog", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateEndDatePriceCatalog = async (req, res) => {
  try {
    const id = req.params.id;
    const newDate = req.body.endDate;
    console.log(id, newDate);

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
    const newEndDate = new Date(newDate);
    if (newEndDate <= startDate) {
      return res.status(400).json({ message: "Invalid date range" });
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
    const ls = await getCatalogActiveByDate(new Date(catalog.startDate));
    console.log(ls);

    //check item exist in another catalog
    if (ls.length > 0) {
      for (const catalog of ls) {
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
module.exports = {
  createPriceCatalog,
  updateEndDatePriceCatalog,
  activePriceCatalog,
  delelePriceCatalog,
};
