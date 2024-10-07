const { default: mongoose } = require("mongoose");
const Promotion = require("../models/promotion.model");
const PromotionLine = require("../models/promotion_line.model");
const { generateID, increaseLastId } = require("./lastID.service");

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
    }
    await PromotionLine.create(data);
    session.commitTransaction();
    return {
      code: 200,
      message: "Successfully",
    };
  } catch (error) {
    console.log(error);

    session.abortTransaction();
    return {
      code: 500,
      message: "Internal server error",
    };
  } finally {
    session.endSession();
  }
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
const getPromotionDetailForInvoice = async (time, listItemId, sub_total) => {
  const data = await PromotionLine.aggregate([
    {
      $match: {
        status: "active",
        startDate: { $lte: time },
        endDate: { $gte: time },
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
                {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$type", "discount-bill"] },
                        then: { $lt: ["$$detailItem.bill", sub_total] }, // Nếu là discount-bill thì bill < sub_total
                      },
                      {
                        case: { $eq: ["$type", "discount-service"] },
                        then: {
                          $or: [
                            { $in: ["$$detailItem.itemId", listItemId] },
                            { $in: ["$$detailItem.itemGiftId", listItemId] },
                          ], // Nếu là discount-service thì itemId và itemGiftId phải nằm trong listItemId
                        },
                      },
                    ],
                    default: false, // Điều kiện mặc định nếu không thuộc hai loại trên
                  },
                },
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
  // Lấy ra danh sách các phần tử của discount-bill và discount-service
  const discountBillItems = data.filter(
    (item) => item.type === "discount-bill"
  );
  const discountServiceItems = data.filter(
    (item) => item.type === "discount-service"
  );

  // Nếu danh sách discount-bill không rỗng, tìm phần tử có discount lớn nhất
  const maxDiscountBill =
    discountBillItems.length > 0
      ? discountBillItems.reduce(
          (max, item) => (item.discount > max.discount ? item : max),
          { discount: 0 }
        )
      : null; // Nếu rỗng trả về null hoặc giá trị mặc định

  // Nếu danh sách discount-service không rỗng, tìm phần tử có itemGiftId trùng nhau với discount lớn nhất
  const discountServiceByGiftId =
    discountServiceItems.length > 0
      ? discountServiceItems.reduce((acc, item) => {
          const existing = acc.find((el) => el.itemGiftId === item.itemGiftId);
          if (!existing || item.discount > existing.discount) {
            return [...acc, item];
          }
          return acc;
        }, [])
      : []; // Nếu rỗng trả về mảng trống hoặc giá trị mặc định

  // Kết hợp kết quả, chỉ lấy những phần tử có giá trị
  const result = [
    ...discountServiceByGiftId,
    ...(maxDiscountBill ? [maxDiscountBill] : []), // Chỉ thêm nếu maxDiscountBill không phải null
  ];
  return result;
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
  getPromotionDetailForInvoice,
};
