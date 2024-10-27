const { default: mongoose } = require("mongoose");
const Promotion = require("../models/promotion.model");
const PromotionLine = require("../models/promotion_line.model");
const { generateID, increaseLastId } = require("./lastID.service");
const { formatCurrency } = require("../utils/convert");
const validator = require("validator");
const createPromotion = async (promotion) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    promotion.promotionId = await generateID("CTKM", { session });
    await increaseLastId("CTKM", { session });
    promotion.startDate = new Date(promotion.startDate);
    promotion.endDate = new Date(promotion.endDate);
    promotion.startDate.setHours(0, 0, 0, 0);
    promotion.endDate.setHours(23, 59, 59, 0);
    result = await Promotion.create([promotion], { session });
    await session.commitTransaction();
    return { code: 200, message: "Thành công", data: result[0] };
  } catch (error) {
    await session.abortTransaction();
    console.log("Đã xảy ra lỗi máy chủ", error);
    if (error.code == 11000 && error.keyValue["code"]) {
      return {
        code: 400,
        message: `Mã ${error.keyValue["code"]} đã tồn tại`,
        data: null,
      };
    }
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    session.endSession();
  }
};

const updatePromotion = async (id, promotion) => {
  try {
    const obj = await Promotion.findById(id);
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy chương trình khuyến mãi",
        data: null,
      };
    }
    lines = await getPromotionLineByParent(id);
    if (lines.length > 0) {
      delete promotion.startDate;
      delete promotion.endDate;
    }
    const result = await Promotion.findOneAndUpdate(
      { _id: id },
      { $set: promotion },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Errror in update promotion", error);
    if (error.code == 11000 && error.keyValue["code"]) {
      return {
        code: 400,
        message: `Mã ${error.keyValue["code"]} đã tồn tại`,
        data: null,
      };
    }
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const deletePromotion = async (id) => {
  try {
    const obj = await Promotion.findById(id);
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy chương trình khuyến mãi",
        data: null,
      };
    }
    lines = await getPromotionLineByParent(obj._id);
    if (lines.length > 0) {
      return {
        code: 400,
        message: "Chỉ có thể xoá chương trình khuyến mãi rỗng",
        data: null,
      };
    }
    result = await Promotion.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Errror in update promotion", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const getPromotion = async (id) => await Promotion.findById(id);
const getPromotions = async (page, limit, field, word) => {
  try {
    const filter = { status: { $ne: "deleted" } };
    if (field && word) {
      filter[field] = RegExp(word, "iu");
    }
    const totalCount = await Promotion.countDocuments(filter);
    const result = await Promotion.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPage = Math.ceil(totalCount / limit);
    return {
      code: 200,
      message: "Thành công",
      totalCount,
      totalPage,
      data: result,
    };
  } catch (error) {
    console.log("Error in get all promotion", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const createPromotionLine = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const parent = await Promotion.findById(data.parentId).lean();
    if (!parent) {
      return {
        code: 400,
        message: "Không tìm thấy chương trình khuyến mãi của dòng khuyến mãi",
        data: null,
      };
    }
    const parentStart = new Date(parent.startDate);
    const parentEnd = new Date(parent.endDate);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const now = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 0);
    if (startDate > endDate) {
      return {
        code: 400,
        message: "Thời gian bắt đầu phải lớn hơn thời gian kết thúc",
        data: null,
      };
    }
    if (startDate < now) {
      return {
        code: 400,
        message: "Thời gian bắt đầu phải sau ngày hiện tại",
        data: null,
      };
    }
    if (startDate < parentStart || endDate > parentEnd) {
      return {
        code: 400,
        message:
          "Ngày bắt đầu hoặc ngày kết thức nằm ngoài chương trình khuyến mãi",
        data: null,
      };
    }
    // kiêm tra code trùng trong detail
    if (data.detail.length > 1) {
      const codes = new Set(data.detail.map((ele) => ele.code));
      if (codes.size < data.detail.length) {
        return {
          code: 400,
          message: "Mã chi tiết khuyến mãi không được trùng nhau",
          data: null,
        };
      }
    }
    data.lineId = await generateID("CTKMCT", { session });
    await increaseLastId("CTKMCT", { session });
    for (let i = 0; i < data.detail.length; i++) {
      // data.detail[i].code = await generateID("COD", { session });
      // await increaseLastId("COD", { session });
      data.detail[i].description = await addDescriptionPromotionDetail(
        data.detail[i],
        data.type
      );
    }
    data.startDate = new Date(startDate);
    data.endDate = new Date(endDate);
    const result = await PromotionLine.create([data], { session });
    await session.commitTransaction();
    return {
      code: 200,
      message: "Successfully",
      data: result[0],
    };
  } catch (error) {
    console.log(error);

    await session.abortTransaction();
    if (error.code == 11000) {
      if (error.keyValue["code"]) {
        return {
          code: 400,
          message: "Mã dòng khuyến mãi tồn tại " + error.keyValue["code"],
          data: null,
        };
      }
      if (error.keyValue["detail.code"]) {
        return {
          code: 400,
          message:
            "Mã chi tiết khuyến mãi tồn tại: " + error.keyValue["detail.code"],
          data: null,
        };
      }
    }
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const updatePromotionLine = async (id, promotionLine) => {
  try {
    delete promotionLine.status;
    const obj = await PromotionLine.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dòng khuyễn mãi",
        data: null,
      };
    }
    if (obj.status == "active" || obj.status == "expires") {
      return {
        code: 400,
        message:
          "Không thể sửa dòng khuyến mãi đang hoạt động hoặc đã qua sử dụng",
        data: null,
      };
    }
    const newLine = new PromotionLine({ ...obj, ...promotionLine });
    const parent = await Promotion.findById(obj.parentId).lean();
    if (!parent) {
      return {
        code: 400,
        message: "Không tìm thấy chương trình khuyến mãi của dòng khuyến mãi",
        data: null,
      };
    }
    if (newLine.detail.length > 1) {
      const codes = new Set(newLine.detail.map((ele) => ele.code));
      if (codes.size < newLine.detail.length) {
        return {
          code: 400,
          message: "Mã chi tiết khuyến mãi không được trùng nhau",
          data: null,
        };
      }
    }
    const parentStart = new Date(parent.startDate);
    const parentEnd = new Date(parent.endDate);
    const startDate = new Date(newLine.startDate);
    const endDate = new Date(newLine.endDate);
    const now = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 0);
    if (startDate > endDate) {
      return {
        code: 400,
        message: "Thời gian bắt đầu phải lớn hơn thời gian kết thúc",
        data: null,
      };
    }
    if (startDate < now) {
      return {
        code: 400,
        message: "Thời gian bắt đầu phải sau ngày hiện tại",
        data: null,
      };
    }
    if (startDate < parentStart || endDate > parentEnd) {
      return {
        code: 400,
        message:
          "Ngày bắt đầu hoặc ngày kết thức nằm ngoài chương trình khuyến mãi",
        data: null,
      };
    }
    newLine.startDate = new Date(startDate);
    newLine.endDate = new Date(endDate);
    for (let i = 0; i < newLine.detail.length; i++) {
      // data.detail[i].code = await generateID("COD", { session });
      // await increaseLastId("COD", { session });
      newLine.detail[i].description = await addDescriptionPromotionDetail(
        newLine.detail[i],
        newLine.type
      );
    }
    await newLine.validate();
    const result = await PromotionLine.findOneAndUpdate({ _id: id }, newLine, {
      new: true,
    });
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in update promotion line ", error);
    if (error.name == "ValidationError" && error.errors) {
      console.log("Error validate promotion line ", error);
      return { code: 400, message: "Dữ liệu không hợp lệ", data: null };
    }
    if (error.code == 11000) {
      if (error.keyValue["code"]) {
        return {
          code: 400,
          message: "Mã dòng khuyến mãi tồn tại " + error.keyValue["code"],
          data: null,
        };
      }
      if (error.keyValue["detail.code"]) {
        return {
          code: 400,
          message:
            "Mã chi tiết khuyến mãi tồn tại " + error.keyValue["detail.code"],
          data: null,
        };
      }
    }
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};

const deletePromotionLine = async (id) => {
  try {
    const obj = await PromotionLine.findById(id);
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dòng khuyến mãi",
        data: null,
      };
    }
    if (obj.status == "active" || obj.status == "expires") {
      return {
        code: 400,
        message:
          "Không thể xoá dòng khuyến mãi đang hoạt động hoặc đã qua sử dụng",
        data: null,
      };
    }
    const result = await PromotionLine.delete({ _id: id });
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in delete promotion line", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", error };
  }
};
const updateEndDatePromotionLine = async (id, date) => {
  try {
    const obj = await PromotionLine.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dòng khuyến mãi",
        data: null,
      };
    }
    if (obj.status == "expires") {
      return {
        code: 400,
        message: "Không thể cập nhật bảng giá đã qua sử dụng",
        data: null,
      };
    }
    if (!validator.isISO8601(date)) {
      if (typeof date != "number" || !date) {
        return {
          code: 400,
          message: "EndDate phải là ngày",
          data: null,
        };
      }
    }
    const startDate = new Date(obj.startDate);
    const oldEndDate = new Date(obj.endDate);
    const newEndDate = new Date(date);
    newEndDate.setHours(23, 59, 59, 0);
    const now = new Date();
    if (newEndDate > oldEndDate) {
      return {
        code: 400,
        message: "Ngày kết thúc mới phải nhỏ hơn ngày kết thúc cũ",
        data: null,
      };
    }
    if (newEndDate < now) {
      return {
        code: 400,
        message: "Ngày kết thúc không được nhỏ hơn ngày hiện tại",
        data: null,
      };
    }
    if (newEndDate < startDate) {
      return {
        code: 400,
        message: "Ngày kết thúc mới không được nhỏ nhở ngày bắt đầu",
        data: null,
      };
    }
    const result = await PromotionLine.findOneAndUpdate(
      { _id: id },
      { $set: { endDate: newEndDate } },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in update endDate promotion line", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const getPromotionLineByParent = async (parentId) =>
  await PromotionLine.find({
    parentId: parentId,
  }).lean();

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
    data.code = await generateID("COD", { session });
    await increaseLastId("COD", { session });
    const result = await PromotionLine.findOneAndUpdate(
      { _id: id },
      {
        $addToSet: {
          detail: data,
        },
      },
      { new: true, session }
    );
    await session.commitTransaction();
    return {
      EC: 200,
      data: result,
    };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
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
const refreshStatusPromotionLine = async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    await PromotionLine.updateMany(
      { startDate: { $eq: now } },
      { status: "active" }
    );
    await PromotionLine.updateMany(
      { endDate: { $lte: now } },
      { status: "expires" }
    );
  } catch (error) {
    console.log("Error in refreshStatusPrmotionLine");
  }
};
const updateItemNamePromotionLine = async (itemId, itemName, session) => {
  await PromotionLine.updateMany(
    {
      status: {
        $ne: "deleted",
      },
      type: "discount-service",
      "detail.itemId": itemId,
    },
    {
      $set: {
        "detail.$[elem].itemName": itemName,
      },
    },
    {
      arrayFilters: [{ "elem.itemId": itemId }],
      ...session,
    }
  );
  await PromotionLine.updateMany(
    {
      status: {
        $ne: "deleted",
      },
      type: "discount-service",
      "detail.itemGiftId": itemId,
    },
    {
      $set: {
        "detail.$[elem].itemGiftName": itemName,
      },
    },
    {
      arrayFilters: [{ "elem.itemGiftId": itemId }],
    }
  );
};
const getPromotionLineById = async (id) => await PromotionLine.findById(id);
const updateStatusActivePromotionLine = async (id) => {
  try {
    const obj = await PromotionLine.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dòng khuyến mãi",
        data: null,
      };
    }
    if (new Date(obj.startDate) < new Date()) {
      return {
        code: 400,
        message: "Chỉ có thể kích hoạt dòng khuyến mãi trong tương lai",
        data: null,
      };
    }
    if (obj.type == "discount-service") {
      const lineDuplicate = await findPromotionDetailDuplicate(obj);
      if (lineDuplicate) {
        return {
          code: 400,
          message: `Xung đột với dòng khuyến mãi <${lineDuplicate.code}> mã chi tiết <${lineDuplicate.detail.code}>`,
          data: null,
        };
      }
    }
    const result = await PromotionLine.findOneAndUpdate(
      { _id: obj._id },
      { status: "active" },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in active promotion line", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const updateStatusInactivePromotionLine = async (id) => {
  try {
    const obj = await PromotionLine.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dòng khuyến mãi",
        data: null,
      };
    }
    if (obj.status == "expires") {
      return {
        code: 400,
        message: "Dòng khuyến mãi đã qua sử dụng không thể chỉnh sửa",
        data: null,
      };
    }
    if (new Date(obj.startDate) < new Date()) {
      return {
        code: 400,
        message: "Dòng khuyến mãi đang được sử dụng không thể ngưng hoạt động",
        data: null,
      };
    }
    const result = await PromotionLine.findOneAndUpdate(
      { _id: obj._id },
      { status: "inactive" },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in inactive promotion line", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const findPromotionDetailDuplicate = async (promotionLine) => {
  const listDetail = promotionLine.detail;
  if (!listDetail || listDetail.length == 0) {
    return null;
  }
  const d1 = new Date(promotionLine.startDate);
  const d2 = new Date(promotionLine.endDate);
  const pipeline = [
    {
      $match: {
        status: "active",
        type: "discount-service",
        $or: [
          { startDate: { $gte: d1, $lt: d2 } },
          { endDate: { $gt: d1, $lte: d2 } },
          { startDate: { $lte: d1 }, endDate: { $gte: d2 } },
        ],
      },
    },
    { $unwind: "$detail" },
    {
      $replaceRoot: {
        newRoot: { detail: "$detail", code: "$code" },
      },
    },
  ];
  const listDetailInfluence = await PromotionLine.aggregate(pipeline);
  console.log(listDetailInfluence); //log
  for (let detailX of listDetailInfluence) {
    for (let detailY of listDetail) {
      if (
        detailX.detail.itemId == detailY.itemId &&
        detailX.detail.itemGiftId == detailY.itemGiftId
      ) {
        return detailX;
      }
    }
  }
  return null;
};
const updateStatusPromotionLine = async (id) => {
  try {
    const obj = await PromotionLine.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy bảng giá",
        data: null,
      };
    }
    if (obj.status == "active") {
      return await updateStatusInactivePromotionLine(obj);
    } else if (obj.status == "inactive") {
      return await updateStatusActivePromotionLine(obj);
    }
    return {
      code: 400,
      message: "Chỉ có đổi qua lại giữa đang hoạt động và ngưng hoạt động",
      data: null,
    };
  } catch (error) {
    console.log("Error in updateStatusPromotionLine", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
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
  getPromotionLineById,
  pushPromotionDetail,
  removePromotionDetail,
  getProBill,
  getProService,
  addDescriptionPromotionDetail,
  updateEndDatePromotionLine,
  refreshStatusPromotionLine,
  updateItemNamePromotionLine,
  updateStatusActivePromotionLine,
  updateStatusInactivePromotionLine,
  updateStatusPromotionLine,
};
