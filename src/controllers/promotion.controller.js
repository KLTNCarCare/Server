const { isTime } = require("validator");
const {
  createPromotion,
  deletePromotion,
  updatePromotion,
  createPromotionLine,
  deletePromotionLine,
  updatePromotionLine,
  getPromotions,
  getPromotionLineByParent,
  getPromotion,
  getTotalPage,
  getPromotionLineById,
} = require("../services/promotion.service");

const savePromotion = async (req, res) => {
  try {
    const promotion = req.body;
    const result = await createPromotion(promotion);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in savePromotion", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const removePromotion = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deletePromotion(id);
    if (!result) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in removePromotion", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const editPromotion = async (req, res) => {
  try {
    const id = req.params.id;
    const promotion = await getPromotion(id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    const infoChange = {
      promotionName: req.body.promotionName || promotion.promotionName,
      description: req.body.description || promotion.description,
      startDate: req.body.startDate || promotion.startDate,
      endDate: req.body.endDate || promotion.endDate,
    };
    const startDate = new Date(infoChange.startDate);
    const endDate = new Date(infoChange.endDate);
    //check date range
    if (startDate >= endDate || Date.now() >= startDate) {
      return res
        .status(400)
        .json({ message: "Valid range : Date now <  startDate < endDate" });
    }
    const result = await updatePromotion(id, infoChange);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in editPromotion", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const savePromotionLine = async (req, res) => {
  try {
    const promotionLine = req.body;
    console.log(promotionLine);

    const result = await createPromotionLine(promotionLine);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in savePromotionLine", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const removePromotionLine = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deletePromotionLine(id);
    if (!result) {
      return res.status(404).json({ message: "Promotion line not found" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in deletePromotionLine", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editPromotionLine = async (req, res) => {
  try {
    const id = req.params.id;
    let line = await getPromotionLineById(id);
    if (!line) {
      return res.status(400).json({ message: "Promotion line not found" });
    }
    console.log(">>line before", line);
    console.log(">>body before", req.body);

    const infoChange = {
      description: req.body.description || line.description,
      discount: req.body.discount || line.discount,
      startDate: req.body.startDate || line.startDate,
      endDate: req.body.endDate || line.endDate,
      itemId: req.body.itemId || line.itemId,
      itemGiftId: req.body.itemGiftId || line.itemGiftId,
      discount: req.body.discount || line.discount,
      limitDiscount: req.body.limitDiscount || line.limitDiscount,
    };
    console.log(">>infoChange", infoChange);

    //check date range
    const parent = await getPromotion(line.parentId);
    if (!parent) {
      return res.status(500).json({ message: "Promotion not found" });
    }
    const startDate = new Date(infoChange.startDate);
    const endDate = new Date(infoChange.endDate);
    const parentStartDate = new Date(parent.startDate);
    const parentEndDate = new Date(parent.endDate);
    if (startDate <= parentStartDate || endDate >= parentEndDate) {
      return res.status(400).json({
        message:
          "Valid range : parent.startDate <  startDate < endDate < parent.endDate",
      });
    }
    const result = await updatePromotionLine(id, infoChange);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in editPromotionLine", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllPromotion = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPage = await getTotalPage(limit);
    const data = await getPromotions(page, limit);
    return res.status(200).json({ data, totalPage });
  } catch (error) {
    console.log("Error in getAllPromotion", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getPromotionLineByParentId = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    const result = await getPromotionLineByParent(parentId);
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in getPromotionLineByParentId", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  savePromotion,
  removePromotion,
  editPromotion,
  savePromotionLine,
  removePromotionLine,
  editPromotionLine,
  getAllPromotion,
  getPromotionLineByParentId,
};
