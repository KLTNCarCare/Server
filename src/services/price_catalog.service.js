const { default: mongoose } = require("mongoose");
const PriceCatalog = require("../models/priceCatalog.model");
const { generateID, increaseLastId } = require("../services/lastID.service");
const createCatalog = async (priceCatalog) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    priceCatalog.priceId = await generateID("BG");
    await increaseLastId("BG");
    const result = await PriceCatalog.create(priceCatalog);
    session.commitTransaction();
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in  create price catalog", error);
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
const updatePriceCatalog = async (id, newPriceCatalog) => {
  try {
    const obj = await PriceCatalog.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy bảng giá để cập nhật",
        data: null,
      };
    }
    if (obj.status == "active") {
      return {
        code: 400,
        message: "Không thể cập nhật bảng giá đang hoạt động",
        data: null,
      };
    }
    console.log(obj);

    const data = new PriceCatalog({
      ...obj,
      ...newPriceCatalog,
    });
    await data.validate();
    const result = await PriceCatalog.findOneAndUpdate({ _id: id }, data, {
      new: true,
    });
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in update price catalog", error);
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  }
};
const updateEndDate = async (id, newDate) =>
  await PriceCatalog.findOneAndUpdate(
    { _id: id },
    { endDate: newDate },
    { new: true }
  );
const activeCatalog = async (id) => {
  try {
    const result = await PriceCatalog.findOneAndUpdate(
      { _id: id },
      { status: "active" },
      { new: true }
    );
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in active price catalog", error);
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  }
};
const inactiveCatalog = async (id) =>
  await PriceCatalog.findOneAndUpdate(
    { _id: id },
    { status: "inactive" },
    { new: true }
  );
const deleteCatalog = async (id) => {
  try {
    const obj = await PriceCatalog.findById(id);
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy bảng giá để xoá",
        data: null,
      };
    }
    const startDate = new Date(obj.startDate);
    const endDate = new Date(obj.endDate);
    const now = new Date();
    if (startDate < now && now < endDate && obj.status == "active") {
      return {
        code: 200,
        message: "Không thể xoá bảng giá đang được áp dụng",
        data: null,
      };
    }
    const result = await PriceCatalog.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in delete price catalog", error);
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  }
};
const getCatalogActiveByRangeDate = async (start, end) =>
  await PriceCatalog.find({
    $or: [
      { startDate: { $gte: start, $lte: end } },
      { endDate: { $gte: start, $lte: end } },
      { startDate: { $lte: start }, endDate: { $gte: end } },
    ],
    status: "active",
  });
const getCatalogById = async (id) => await PriceCatalog.findById(id);
// get catalog with active status and current date
const getActiveCurrentDate = async (page, limit) =>
  await PriceCatalog.find({
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  })
    .skip((page - 1) * limit)
    .limit(limit);
//get catalog with active status
const getActiveCatalog = async (page, limit) =>
  await PriceCatalog.find({ status: "active" })
    .skip((page - 1) * limit)
    .limit(limit);
// get all catalog with active, inactive status
const getAllCatalog = async (page, limit) =>
  await PriceCatalog.find({ status: { $ne: "deleted" } })
    .skip((page - 1) * limit)
    .limit(limit);
const getTotalPage = async (limit) => {
  const total = await PriceCatalog.countDocuments({
    status: { $ne: "deleted" },
  });
  return Math.ceil(total / limit);
};
const getPriceByServices = async (time, services) => {
  const result = await PriceCatalog.aggregate([
    {
      $match: {
        startDate: { $lte: time },
        endDate: { $gte: time },
        status: "active",
      },
    },
    {
      $project: {
        items: {
          $filter: {
            input: "$items",
            as: "service",
            cond: {
              $in: ["$$service.itemId", services], // Dùng $$service để tham chiếu đến biến hiện tại
            },
          },
        },
      },
    },
    {
      $unwind: {
        path: "$items",
        preserveNullAndEmptyArrays: true, // Giữ lại các tài liệu không có item
      },
    },
    {
      $match: {
        items: { $ne: null }, // Lọc ra các mục không phải null
      },
    },
    {
      $replaceRoot: {
        newRoot: "$items",
      },
    },
  ]);
  return result;
};

const getAllPriceCurrent = async (textSearch) => {
  try {
    const now = new Date();
    const pipline = [
      {
        $match: {
          status: "active",
          startDate: { $lte: now },
          endDate: { $gte: now },
        },
      },
      {
        $project: {
          items: 1,
          _id: 0,
        },
      },
      {
        $unwind: "$items",
      },
      {
        $addFields: {
          itemObjectId: { $toObjectId: "$items.itemId" },
        },
      },
      {
        $lookup: {
          from: "services", // join with the service collection
          localField: "itemObjectId", // field from PriceCatalog items
          foreignField: "_id", // matching field from service
          as: "serviceDetails",
        },
      },
      {
        $unwind: "$serviceDetails", // unwrap the service details
      },
      {
        $addFields: {
          categoryObjId: { $toObjectId: "$serviceDetails.categoryId" },
        },
      },
      {
        $lookup: {
          from: "service_packages", // join with the service_package collection
          localField: "categoryObjId", // field from service
          foreignField: "_id", // matching field from service_package
          as: "packageDetails",
        },
      },
      {
        $unwind: "$packageDetails", // unwrap the service package details
      },
      {
        $replaceRoot: {
          newRoot: {
            itemId: "$items.itemId",
            itemName: "$items.itemName",
            categoryId: "$serviceDetails.categoryId",
            categoryName: "$packageDetails.categoryName",
            price: "$items.price",
            duration: "$serviceDetails.duration", // attaching the service package name
          },
        },
      },
    ];
    if (textSearch != "") {
      pipline.push({
        $match: {
          itemName: {
            $regex: RegExp(textSearch, "iu"),
          },
        },
      });
    }
    const data = await PriceCatalog.aggregate(pipline);
    return {
      code: 200,
      message: "Successful",
      data: data,
    };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Internal server error", data: null };
  }
};

module.exports = {
  createCatalog,
  getCatalogById,
  updateEndDate,
  updatePriceCatalog,
  getCatalogActiveByRangeDate,
  activeCatalog,
  deleteCatalog,
  inactiveCatalog,
  getAllCatalog,
  getActiveCurrentDate,
  getActiveCatalog,
  getTotalPage,
  getPriceByServices,
  getAllPriceCurrent,
};
