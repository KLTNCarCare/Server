const { default: mongoose, ConnectionStates } = require("mongoose");

const { generateID, increaseLastId } = require("./lastID.service");
const Customer = require("../models/customer.model");

const createCustomer = async (cust) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    cust.custId = await generateID("KH", { session });
    await increaseLastId("KH", { session });
    const result = await Customer.create([cust], { session });
    await session.commitTransaction();
    return {
      code: 200,
      message: "Thành công",
      data: result[0],
    };
  } catch (error) {
    await session.abortTransaction();
    if (error.code == 11000) {
      return { code: 400, message: "Số điện thoại đã tồn tại", data: null };
    }
    if (
      error.name == "ValidationError" &&
      error.errors &&
      error.errors["phone"]
    )
      return { code: 400, message: error.errors["phone"].message, data: null };
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const findCustById = async (id) => await Customer.findById(id);
const findCustByCustId = async (custId) =>
  await Customer.findOne({ custId: custId });
const findCustByPhone = async (phone) =>
  await Customer.findOne({ phone: phone }).lean();
const pushVehicle = async (id, vehicle) =>
  await Customer.findOneAndUpdate(
    { _id: id, "vehicles.licensePlate": { $ne: vehicle.licensePlate } },
    {
      $addToSet: { vehicles: vehicle },
    },
    {
      new: true,
    }
  );
const pullVehicle = async (id, licensePlate) =>
  await Customer.findOneAndUpdate(
    { _id: id },
    {
      $pull: {
        items: { licensePlate: licensePlate },
      },
    }
  );
const findAllCustomer = async (page, limit, k, v, sort, sortOrder) => {
  try {
    const filter = { status: { $ne: "deleted" } };
    const sortMap = {};
    sortMap[sort] = sortOrder;
    if (k && v) {
      filter[k] = RegExp(v, "iu");
    }
    const count = await Customer.countDocuments(filter);
    const data = await Customer.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortMap);
    return {
      code: 200,
      message: "Success",
      data: {
        totalPage: Math.ceil(count / limit),
        totalCount: count,
        data: data,
      },
    };
  } catch (error) {
    console.log("Error in find all customer", error);
    return {
      code: 200,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const updateCustomer = async (id, custUpdate) => {
  try {
    const obj = await Customer.findById(id).lean();
    const newCustomer = new Customer({ ...obj, ...custUpdate });
    await newCustomer.validate();
    const result = await Customer.findOneAndUpdate(
      { _id: id },
      { $set: newCustomer },
      {
        new: true,
      }
    );
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in updateCustomer", error);
    if (
      error.name == "ValidationErorr" &&
      error.errors &&
      error.erros["phone"]
    ) {
      return { code: 400, message: error.errors["phone"].message, data: null };
    }
    if (error.code == 11000) {
      return { code: 400, message: "Số điện thoại đã tồn tại", data: null };
    }
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const deleteCustomer = async (id) => {
  try {
    const result = await Customer.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    return {
      code: 200,
      message: "Succesful",
      data: result,
    };
  } catch (error) {
    console.log("Error in updateCustomer", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
module.exports = {
  createCustomer,
  findCustByCustId,
  findCustById,
  findCustByPhone,
  pushVehicle,
  pullVehicle,
  findAllCustomer,
  updateCustomer,
  deleteCustomer,
};
