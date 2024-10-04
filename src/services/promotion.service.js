const Promotion = require("../models/promotion.model");
const PromotionLine = require("../models/promotion_line.model");
const { generateID } = require("./lastID.service");

const createPromotion = async (promotion) => {
  promotion.promotionId = await generateID("CTKM");
  return await Promotion.create(promotion);
};

const updatePromotion = async (id, promotion) => {
  const result = await Promotion.findOneAndUpdate({ _id: id }, promotion, {
    new: true,
  });
  await PromotionLine.updateMany(
    { parentId: id, startDate: { $lt: promotion.startDate } },
    { $set: { startDate: promotion.startDate } },
    { new: true }
  );
  await PromotionLine.updateMany(
    { parentId: id, endDate: { $gt: promotion.endDate } },
    { $set: { endDate: promotion.endDate } },
    { new: true }
  );
  return result;
};
const deletePromotion = async (id) => {
  await PromotionLine.updateMany(
    { parentId: id },
    { status: "inactive" },
    { new: true }
  );
  return await Promotion.findOneAndUpdate(
    { _id: id },
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
  await PromotionLine.find({ parentId, status: "active" }).lean();
const getTotalPage = async (limit) => {
  const totalPromotion = await Promotion.countDocuments({ status: "active" });
  return Math.ceil(totalPromotion / limit);
};

const pushPromotionDetail = async (id, data) => {
  const line = await PromotionLine.findById({ _id: id });
  if (!line) {
    return {
      EC: 400,
      data: null,
    };
  }
  switch (line.type) {
    case "discount-bill":
      if (!data.bill || !data.discount || !data.limitDiscount)
        return {
          EC: 400,
          data: null,
        };
      break;
    case "discount-service":
      if (!data.itemId || !data.itemGiftId || !data.discount)
        return { EC: 400, data: null };
      break;
  }
  return {
    EC: 200,
    data: await PromotionLine.findOneAndUpdate(
      { _id: id },
      {
        $addToSet: {
          detail: data,
        },
      },
      { new: true }
    ),
  };
};
const removePromotionDetail = async (idLine, idDetail) =>
  await PromotionLine.findOneAndUpdate(
    { _id: idLine },
    {
      $set: { "detail.$[ele].status": "inactive" },
    },

    {
      arrayFilters: [{ "ele._id": idDetail }],
    },
    { new: true }
  );

const getPromotionLineById = async (id) => await PromotionLine.findById(id);
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
  getPromotionLineById,
  getTotalPage,
  pushPromotionDetail,
  removePromotionDetail,
};
