const { default: mongoose } = require("mongoose");
const PriceCatalog = require("../models/priceCatalog.model");
const { generateID, increaseLastId } = require("../services/lastID.service");
const validator = require("validator");
const createCatalog = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    data.priceId = await generateID("BG", { session });
    await increaseLastId("BG", { session });
    const priceCatalog = new PriceCatalog(data);
    await priceCatalog.validate();
    //check item exist in another catalog
    // const serviceIds = priceCatalog.items.map((item) => item.itemId);
    // const listObj = await getCatalogByRangeDate(
    //   new Date(priceCatalog.startDate),
    //   new Date(priceCatalog.endDate)
    // );
    // if (listObj.length > 0) {
    //   for (let catalog of listObj) {
    //     const check = catalog.items.some((item) =>
    //       serviceIds.includes(item.itemId)
    //     );
    //     if (check) {
    //       return {
    //         code: 400,
    //         message: "Xung đột với bảng giá " + catalog.priceId,
    //         data: null,
    //       };
    //     }
    //   }
    // }
    const result = await PriceCatalog.create([data], { session });
    await session.commitTransaction();
    return {
      code: 200,
      message: "Thành công",
      data: result[0],
    };
  } catch (error) {
    console.log("Error in  create price catalog", error);
    await session.abortTransaction();
    if (
      (error.name = "ValidatorError" && error.errors && error.errors["items"])
    ) {
      return {
        code: 400,
        message: error.errors["items"].message,
        data: null,
      };
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
    if (obj.status == "active" || obj.status == "expires") {
      return {
        code: 400,
        message:
          "Không thể cập nhật bảng giá đang hoạt động và bảng giá đã qua sử dụng",
        data: null,
      };
    }
    const data = new PriceCatalog({
      ...obj,
      ...newPriceCatalog,
    });
    data.startDate = new Date(data.startDate).setHours(0, 0, 0, 0);
    data.endDate = new Date(data.endDate).setHours(23, 59, 59, 0);
    const now = new Date();

    if (data.endDate < now || data.endDate < data.startDate) {
      return {
        code: 400,
        message:
          "Không được phép sửa ngày kết thúc nhỏ hơn ngày hiện tại hoặc nhỏ hơn ngày bắt đầu",
        data: null,
      };
    }
    await data.validate();
    const serviceIds = data.items.map((item) => item.itemId);
    const listObj = await getCatalogByRangeDateOtherId(
      new Date(data.startDate),
      new Date(data.endDate),
      obj._id
    );
    //check item exist in another catalog
    if (listObj.length > 0) {
      for (let catalog of listObj) {
        const check = catalog.items.some((item) =>
          serviceIds.includes(item.itemId)
        );
        if (check) {
          return {
            code: 400,
            message: "Xung đột với bảng giá " + catalog.priceId,
            data: null,
          };
        }
      }
    }
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
    if (
      (error.name = "ValidatorError" && error.errors && error.errors["items"])
    ) {
      return {
        code: 400,
        message: error.errors["items"].message,
        data: null,
      };
    }

    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const updateEndDate = async (id, date) => {
  try {
    const obj = await PriceCatalog.findById(id);
    if (!obj) {
      return { code: 400, message: "Không tìm thấy bảng giá", data: null };
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
        message: "Ngày kết thúc không được nhỏ hơn thời điểm hiện tại",
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
    const result = await PriceCatalog.findOneAndUpdate(
      { _id: id },
      { $set: { endDate: newEndDate } },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in update endDate price catalog", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const activeCatalog = async (obj) => {
  try {
    if (new Date(obj.startDate) <= new Date()) {
      return {
        code: 400,
        message: "Chỉ được phép kích hoạt bảng giá tương lai",
        data: null,
      };
    }
    const serviceIds = obj.items.map((item) => item.itemId);
    const listObj = await getCatalogActiveByRangeDate(
      new Date(obj.startDate),
      new Date(obj.endDate)
    );
    //check item exist in another catalog
    if (listObj.length > 0) {
      for (let catalog of listObj) {
        const check = catalog.items.some((item) =>
          serviceIds.includes(item.itemId)
        );
        if (check) {
          return {
            code: 400,
            message: "Xung đột với bảng giá - " + catalog.priceId,
            data: null,
          };
        }
      }
    }
    const result = await PriceCatalog.findOneAndUpdate(
      { _id: obj._id },
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
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const inactiveCatalog = async (obj) => {
  try {
    if (new Date(obj.startDate) <= new Date()) {
      return {
        code: 400,
        message: "Bảng giá đang được áp dụng không được ngưng hoạt động",
        data: null,
      };
    }
    if (obj.status != "active") {
      return {
        code: 400,
        message: "Bảng giá đã qua sử dụng không được phép chỉnh sửa",
        data: null,
      };
    }
    const result = await PriceCatalog.findOneAndUpdate(
      { _id: obj._id },
      { status: "inactive" },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in inactive price catalog", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
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
    if (obj.status != "inactive") {
      return {
        code: 400,
        message: "Không được xoá bảng giá đang hoạt động hoặc đã qua sử dụng",
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
      message: "Đã xảy ra lỗi máy chủ",
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
const getCatalogByRangeDate = async (start, end) =>
  await PriceCatalog.find({
    $or: [
      { startDate: { $gte: start, $lte: end } },
      { endDate: { $gte: start, $lte: end } },
      { startDate: { $lte: start }, endDate: { $gte: end } },
    ],
    status: { $nin: ["deleted", "expires"] },
  });
const getCatalogByRangeDateOtherId = async (start, end, id) =>
  await PriceCatalog.find({
    $or: [
      { startDate: { $gte: start, $lte: end } },
      { endDate: { $gte: start, $lte: end } },
      { startDate: { $lte: start }, endDate: { $gte: end } },
    ],
    status: { $nin: ["deleted", "expires"] },
    _id: { $ne: id },
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
const getAllCatalog = async (page, limit, field, word) => {
  try {
    const filter = { status: { $ne: "deleted" } };
    if (field && word) {
      filter[field] = RegExp(word, "iu");
    }
    const totalCount = await PriceCatalog.countDocuments(filter);
    const result = await PriceCatalog.find(filter)
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
    console.log("Error in get all price catalog", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
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
    const pipeline = [
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
      pipeline.push({
        $match: {
          itemName: {
            $regex: RegExp(textSearch, "iu"),
          },
        },
      });
    }
    const data = await PriceCatalog.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: data,
    };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const updateItemNamePriceCatalog = async (itemId, itemName, session) =>
  PriceCatalog.updateMany(
    {
      status: {
        $ne: "deleted",
      },
      "items.itemId": itemId,
    },
    {
      $set: {
        "items.$[elem].itemName": itemName,
      },
    },
    {
      arrayFilters: [{ "elem.itemId": itemId }],
      ...session,
    }
  );
const refreshStatusPriceCatalog = async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    await PriceCatalog.updateMany(
      { endDate: { $lte: now }, status: "active" },
      { status: "expires" }
    );
  } catch (error) {
    console.log("Error in refreshStatusPriceCatalog");
  }
};
const updateStatusPriceCatalog = async (id) => {
  try {
    const obj = await PriceCatalog.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy bảng giá",
        data: null,
      };
    }
    if (obj.status == "active") {
      return await inactiveCatalog(obj);
    } else if (obj.status == "inactive") {
      return await activeCatalog(obj);
    }
    return {
      code: 400,
      message: "Chỉ có đổi qua lại giữa đang hoạt động và ngưng hoạt động",
      data: null,
    };
  } catch (error) {
    console.log("Error in updateStatusPriceCatalog", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
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
  getPriceByServices,
  getAllPriceCurrent,
  updateItemNamePriceCatalog,
  refreshStatusPriceCatalog,
  updateStatusPriceCatalog,
};
