const { default: mongoose } = require("mongoose");
const Service = require("../models/service.model");
const { generateID, increaseLastId } = require("./lastID.service");
const res = require("express/lib/response");

const createService = async (service) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    service.serviceId = await generateID("DV");
    await increaseLastId("DV");
    const result = await Service.create(service);
    session.commitTransaction();
    return {
      code: 200,
      message: "Successful",
      data: result,
    };
  } catch (error) {
    console.log("Error in save service", error);
    session.abortTransaction();
    return { code: 500, message: "Internal server error", data: null };
  } finally {
    session.endSession();
  }
};
const deleteService = async (id) => {
  try {
    const result = await Service.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    if (!result) {
      return { code: 400, message: "Xoá thất bại", data: null };
    }
    return {
      code: 200,
      message: "Xoá thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in delete service", error);
    return { code: 500, message: "Internal server error", data: null };
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
    return { code: 500, message: "Internal server error", data: null };
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
    return { code: 500, message: "Internal server error", data: null };
  }
};
const updateService = async (id, service) => {
  try {
    const obj = await Service.findById(id);
    if (!obj) {
      return {
        code: 400,
        message: "Không tìm thấy dịch vụ để cập nhật",
        data: null,
      };
    }
    const result = await Service.findOneAndUpdate({ _id: id }, service, {
      new: true,
    });
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in update service", error);
    return { code: 500, message: "Internal server error", data: null };
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
};
