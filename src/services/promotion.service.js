const Promotion = require("../models/promotion.model");
const PromotionLine = require("../models/promotion_line.model");
const { generateID } = require("./lastID.service");

const createPromotion = async (promotion) => {
  promotion.promotionId = await generateID("CTKM");
  return await Promotion.create(promotion);
};

const updatePromotion = async (id, promotion) =>
  await Promotion.findByIdAndUpdate(id, promotion);

const deletePromotion = async (id) => {
  await PromotionLine.updateMany(
    { parentId: id },
    { status: "inactive" },
    { new: true }
  );
  return await Promotion.findByIdAndUpdate(
    id,
    { status: "inactive" },
    { new: true }
  );
};

const getPromotion = async (id) => await Promotion.findById(id);
const getPromotions = async (page, limit) =>
  await Promotion.find({ status: "active" })
    .skip((page - 1) * limit)
    .limit(limit);
const createPromotionLine = async (promotionLine) => {
  promotionLine.lineId = await generateID("CTKMCT");
  return await PromotionLine.create(promotionLine);
};
const updatePromotionLine = async (id, promotionLine) =>
  await PromotionLine.findOneAndUpdate({ _id: id }, promotionLine, {
    new: true,
  });

const deletePromotionLine = async (id) =>
  await PromotionLine.findOneAndUpdate(
    { _id: id },
    { status: "inactive" },
    { new: true }
  );

const getPromotionLineByParent = async (parentId) =>
  await PromotionLine.find({ parentId, status: "active" });
const getTotalPage = async (limit) => {
  const totalPromotion = await Promotion.countDocuments({ status: "active" });
  return Math.ceil(totalPromotion / limit);
};
module.exports = {
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotion,
  getPromotions,
  createPromotionLine,
  updatePromotionLine,
  deletePromotionLine,
  getPromotionLineByParent,
  getTotalPage,
};
