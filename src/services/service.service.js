const { default: mongoose } = require("mongoose");
const Service = require("../models/service.model");
const { generateID, increaseLastId } = require("./lastID.service");
const res = require("express/lib/response");
const { updateItemNamePriceCatalog } = require("./price_catalog.service");
const { updateItemNamePromotionLine } = require("./promotion.service");
const { getAppointmentByServiceId } = require("./appointment.service");
const createService = async (service) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    service.serviceId = await generateID("DV", { session });
    await increaseLastId("DV", { session });
    const result = await Service.create([service], { session });
    await session.commitTransaction();
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in save service", error);
    await session.abortTransaction();
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    session.endSession();
  }
};
const deleteService = async (id) => {
  try {
    const obj = await Service.findById(id).lean();
    if (!obj) {
      return { code: 400, message: "Không tìm thấy dịch vụ", data: null };
    }
    if (obj.status == "active") {
      return {
        code: 400,
        message: "Không thể xoá dịch vụ đang hoạt động",
        data: null,
      };
    }
    const appointment = await getAppointmentByServiceId(id);
    if (appointment) {
      return {
        code: 400,
        message: "Dịch vụ đã được sử dụng không thể xoá",
        data: null,
      };
    }
    const result = await Service.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    return {
      code: 200,
      message: "Xoá thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in delete service", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const inactiveService = async (id) => {
  try {
    const result = await Service.findOneAndUpdate(
      { _id: id },
      { status: "inactive" },
      { new: true }
    );
    if (!result) {
      return { code: 400, message: "Thất bại", data: null };
    }
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in delete service", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const activeService = async (id) => {
  try {
    const result = await Service.findOneAndUpdate(
      { _id: id },
      { status: "active" },
      { new: true }
    );
    if (!result) {
      return { code: 400, message: "Thất bại", data: null };
    }
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in delete service", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const updateService = async (id, service) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const obj = await Service.findById(id).lean();
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dịch vụ để cập nhật",
        data: null,
      };
    }
    const newService = { ...obj, ...service };
    if (obj.status == "active") {
      if (service.status == "active") {
        return {
          code: 400,
          message: "Trạng thái chưa thay đổi để cập nhật",
          data: null,
        };
      }
      for (let key in obj) {
        if (key == "status") {
          continue;
        }
        if (obj[key] != newService[key]) {
          return {
            code: 400,
            message: "Dịch vụ đang hoạt động chỉ có thể cập nhật trạng thái",
            data: null,
          };
        }
      }
    }

    const appointment = await getAppointmentByServiceId(id);
    if (appointment) {
      if (obj.status == "inactive") {
        for (let key in obj) {
          if (key == "status") {
            continue;
          }
          if (obj[key] != newService[key]) {
            return {
              code: 400,
              message: "Dịch vụ đã được sử dụng chỉ có thể cập nhật trạng thái",
              data: null,
            };
          }
        }
      }
    }
    if (service.serviceName && service.serviceName != obj.serviceName) {
      await updateItemNamePriceCatalog(String(obj._id), service.serviceName, {
        session,
      });
      await updateItemNamePromotionLine(String(obj._id), service.serviceName, {
        session,
      });
    }
    const result = await Service.findOneAndUpdate(
      { _id: id },
      { $set: service },
      {
        session,
        new: true,
      }
    );
    await session.commitTransaction();
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in update service", error);
    await session.abortTransaction();
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    session.endSession();
  }
};
const getTotalPage = async (limit) => {
  const count = await Service.countDocuments({ status: "active" });
  return Math.ceil(count / limit);
};
const findServiceById = async (id) => await Service.findById(id);
const findServicesByListId = async (list) =>
  await Service.find({ _id: { $in: list } });
const findAllService = async (categoryId) =>
  await Service.find({ categoryId, status: { $ne: "deleted" } });
const findAllServiceToPick = async (textSearch) => {
  const now = new Date();
  const pipeline = [
    {
      $match: {
        status: "active",
      },
    },
    {
      $addFields: {
        packObj: {
          $toObjectId: "$categoryId",
        },
      },
    },
    {
      $lookup: {
        from: "service_packages",
        localField: "packObj",
        foreignField: "_id",
        as: "service_package",
      },
    },
    {
      $unwind: {
        path: "$service_package",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "pricecatalogs",
        let: {
          itemId: "$_id",
          day: {
            $toDate: now,
          },
        },
        pipeline: [
          {
            $match: {
              status: "active",
              startDate: { $lte: now },
              endDate: { $gte: now },
            },
          },
          {
            $unwind: "$items",
          },
          {
            $addFields: {
              objId: {
                $toObjectId: "$items.itemId",
              },
            },
          },
          {
            $match: {
              $expr: {
                $eq: ["$objId", "$$itemId"],
              },
            },
          },
          {
            $project: {
              price: "$items.price",
              _id: 0,
            },
          },
        ],
        as: "price",
      },
    },
    {
      $unwind: {
        path: "$price",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          itemId: "$_id",
          itemName: "$serviceName",
          categoryId: "$service_package._id",
          categoryName: "$service_package.categoryName",
          duration: "$duration",
          price: "$price.price",
        },
      },
    },
    {
      $match: {
        price: {
          $ne: null,
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
  const result = await Service.aggregate(pipeline);
  return { code: 200, message: "Thành công", data: result };
};
const findOneSerivceByCategoryId = async (categoryId) =>
  await Service.findOne({
    categoryId: categoryId,
    status: { $ne: "deleted" },
  }).lean();
module.exports = {
  createService,
  deleteService,
  updateService,
  getTotalPage,
  findAllService,
  inactiveService,
  activeService,
  findServiceById,
  findServicesByListId,
  findAllServiceToPick,
  findOneSerivceByCategoryId,
};
