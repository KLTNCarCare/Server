const { default: mongoose } = require("mongoose");
const Promotion = require("../models/promotion.model");
const PromotionLine = require("../models/promotion_line.model");
const { generateID, increaseLastId } = require("./lastID.service");
const { formatCurrency } = require("../utils/convert");

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
const createPromotionLine = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    data.lineId = await generateID("CTKMCT");
    for (let i = 0; i < data.detail.length; i++) {
      data.detail[i].code = await generateID("COD");
      await increaseLastId("COD");
      data.detail[i].description = await addDescriptionPromotionDetail(
        data.detail[i],
        data.type
      );
    }
    const result = await PromotionLine.create(data);
    session.commitTransaction();
    return {
      code: 200,
      message: "Successfully",
      data: result,
    };
  } catch (error) {
    console.log(error);

    session.abortTransaction();
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const updatePromotionLine = async (id, promotionLine) => {
  try {
    const obj = await PromotionLine.findById(id);
    if (!obj) {
      return {
        code: 200,
        message: "Không tìm thấy dòng khuyễn mãi",
        data: null,
      };
    }
    if (obj.status == "active" || obj.status == "expires") {
      return {
        code: 400,
        message: "Không thể sửa promotion đang hoạt động hoặc hết hạn",
        data: null,
      };
    }
    const newLine = new PromotionLine({ ...obj, ...promotionLine });
    const parent = Promotion.findById(obj.parentId);
    if (!parent) {
      return {
        code: 400,
        message: "Không tìm thấy chương trình khuyến mãi của dòng khuyến mãi",
        data: null,
      };
    }
    const parentStart = new Date(parent.startDate);
    const parentEnd = new Date(paretn.endDate);
    const startDate = new Date(newLine.startDate);
    const endDate = new Date(newLine.endDate);
  } catch (error) {
    console.log("Error in update promotion line ", error);
    return { code: 500, message: "Internal server error", data: null };
  }
};
const deletePromotionLine = async (id) =>
  await PromotionLine.findOneAndUpdate(
    { _id: id },
    { status: "inactive" },
    { new: true }
  );

const getPromotionLineByParent = async (parentId) =>
  await PromotionLine.find({ parentId: parentId, status: "active" }).lean();
const getTotalPage = async (limit) => {
  const totalPromotion = await Promotion.countDocuments({ status: "active" });
  return Math.ceil(totalPromotion / limit);
};

const pushPromotionDetail = async (id, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    data.code = await generateID("COD");
    await increaseLastId("COD");
    const result = await PromotionLine.findOneAndUpdate(
      { _id: id },
      {
        $addToSet: {
          detail: data,
        },
      },
      { new: true }
    );
    session.commitTransaction();
    return {
      EC: 200,
      data: result,
    };
  } catch (error) {
    console.log(error);
    session.abortTransaction();
    return {
      EC: 500,
      data: null,
    };
  } finally {
    session.endSession();
  }
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
const getProBill = async (time, sub_total) => {
  const data = await PromotionLine.aggregate([
    {
      $match: {
        status: "active",
        startDate: { $lte: time },
        endDate: { $gte: time },
        type: "discount-bill",
      },
    },
    {
      $project: {
        detail: {
          $filter: {
            input: "$detail",
            as: "detailItem",
            cond: {
              $and: [
                { $eq: ["$$detailItem.status", "active"] }, // Điều kiện status phải là active
                { $lt: ["$$detailItem.bill", sub_total] }, // Điều kiện cho discount-bill: bill < sub_total
              ],
            },
          },
        },
        lineId: "$_id",
        type: "$type",
      },
    },
    {
      $unwind: "$detail", // Chuyển đổi mảng detail thành các tài liệu riêng lẻ
    },
    {
      $addFields: {
        "detail.lineId": "$lineId", // Thêm lineId vào từng phần tử của detail
        "detail.type": "$type", // Thêm type vào detail để truy vấn dễ hơn
      },
    },
    {
      $replaceRoot: {
        newRoot: "$detail", // Thay đổi root thành detail
      },
    },
  ]);

  const maxDiscountBill =
    data.length > 0
      ? data.reduce(
          (max, item) => (item.discount > max.discount ? item : max),
          { discount: 0 }
        )
      : null; // Nếu rỗng trả về null hoặc giá trị mặc định

  return maxDiscountBill;
};

const getProService = async (time, listItemId) => {
  const data = await PromotionLine.aggregate([
    {
      $match: {
        status: "active",
        startDate: { $lte: time },
        endDate: { $gte: time },
        type: "discount-service",
      },
    },
    {
      $project: {
        detail: {
          $filter: {
            input: "$detail",
            as: "detailItem",
            cond: {
              $and: [
                { $eq: ["$$detailItem.status", "active"] },
                { $in: ["$$detailItem.itemId", listItemId] },
                { $in: ["$$detailItem.itemGiftId", listItemId] },
              ],
            },
          },
        },
        lineId: "$_id",
        type: "$type",
      },
    },
    {
      $unwind: "$detail", // Chuyển đổi mảng detail thành các tài liệu riêng lẻ
    },
    {
      $addFields: {
        "detail.lineId": "$lineId", // Thêm lineId vào từng phần tử của detail
        "detail.type": "$type",
      },
    },
    {
      $replaceRoot: {
        newRoot: "$detail", // Thay đổi root thành detail
      },
    },
  ]);

  const discountServiceByGiftId =
    data.length > 0
      ? data.reduce((acc, item) => {
          const existing = acc.find((el) => el.itemGiftId === item.itemGiftId);
          if (!existing || item.discount > existing.discount) {
            return [...acc, item];
          }
          return acc;
        }, [])
      : [];
  return discountServiceByGiftId;
};
const addDescriptionPromotionDetail = async (
  promotionDetail,
  promotionType
) => {
  let str;
  if (promotionType == "discount-bill") {
    const bill = formatCurrency(promotionDetail.bill);
    const limitDiscount = formatCurrency(promotionDetail.limitDiscount);
    str = `Giảm ${promotionDetail.discount}% đối với hoá đơn từ ${bill} trở lên, giảm tối đa ${limitDiscount}`;
  } else {
    if (promotionDetail.itemId == promotionDetail.itemGiftId) {
      str = `Giảm ${promotionDetail.discount}% cho ${promotionDetail.itemName}`;
    } else {
      if (promotionDetail.discount == 100) {
        str = `Miễn phí ${promotionDetail.itemGiftName} khi ${promotionDetail.itemName}`;
      } else {
        str = `Giảm ${promotionDetail.discount}% ${promotionDetail.itemGiftName} khi ${promotionDetail.itemName}`;
      }
    }
  }
  return str;
};
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
  getProBill,
  getProService,
  addDescriptionPromotionDetail,
};
