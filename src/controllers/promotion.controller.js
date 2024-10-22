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
  pushPromotionDetail,
  removePromotionDetail,
  updateEndDatePromotionLine,
} = require("../services/promotion.service");
const { findById, findServiceById } = require("../services/service.service");

const savePromotion = async (req, res) => {
  const data = req.body;
  const result = await createPromotion(data);
  return res.status(result.code).json(result);
};
const removePromotion = async (req, res) => {
  const id = req.params.id;
  const result = await deletePromotion(id);
  return res.status(result.code).json(result);
};
const editPromotion = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await updatePromotion(id, data);
  return res.status(result.code).json(result);
};

const savePromotionLine = async (req, res) => {
  const promotionLine = req.body;
  const result = await createPromotionLine(promotionLine);
  return res.status(result.code).json(result);
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
  const id = req.params.id;
  const line = req.body;
  const result = await updatePromotionLine(id, line);
  return res.status(result.code).json(result);
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
    let result = await getPromotionLineByParent(parentId);
    for (let line of result) {
      if (line.type == "discount-service") {
        line.item = await findServiceById(line.itemId);
        line.itemGift = await findServiceById(line.itemGiftId);
      }
    }

    //get list item gift
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in getPromotionLineByParentId", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const addPromtionDetail = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await pushPromotionDetail(id, data);
  if (result.EC === 400) {
    return res.status(400).json({ message: "Bad request" });
  }
  if (result.EC === 200) {
    return res.status(200).json(result.data);
  }
  return res.status(500).json({ message: "Internal server error" });
};
const deletePromotionDetail = async (req, res) => {
  try {
    const { id, idDetail } = req.params;
    const result = await removePromotionDetail(id, idDetail);
    if (!result) {
      return res.status(400).json({ message: "Bad request" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in deletePromotionDetail ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const editEndDatePromotionLine = async (req, res) => {
  const id = req.params.id;
  const endDate = req.body.endDate;
  const result = await updateEndDatePromotionLine(id, endDate);
  return res.status(result.code).json(result);
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
  addPromtionDetail,
  deletePromotionDetail,
  editEndDatePromotionLine,
};
