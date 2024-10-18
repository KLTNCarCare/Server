const { default: mongoose } = require("mongoose");

const { generateID, increaseLastId } = require("./lastID.service");
const Customer = require("../models/customer.model");
const { find } = require("../models/promotion.model");

const createCustomer = async (cust) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    cust.custId = await generateID("KH");
    await increaseLastId("KH");
    const result = await Customer.create(cust);
    session.commitTransaction();
    return {
      code: 200,
      message: "Successful",
      data: result,
    };
  } catch (error) {
    console.log(error);

    session.abortTransaction();
    return {
      code: 500,
      message: error.message,
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const findCustById = async (id) => await Customer.findById(id);
const findCustByCustId = async (custId) =>
  await Customer.findOne({ custId: custId });
const findCustByPhone = async (phone, limit) =>
  await Customer.find({
    phone: {
      $regex: RegExp("^" + phone, "i"),
    },
  }).limit(limit);
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
const findAllCustomer = async (page, limit) => {
  try {
    const count = await Customer.countDocuments({ status: { $ne: "deleted" } });
    const data = await Customer.find({ status: { $ne: "deleted" } })
      .skip((page - 1) * limit)
      .limit(limit);
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
      message: "Internal server error",
      data: null,
    };
  }
};
const updateCustomer = async (id, custUpdate) => {
  try {
    const result = await Customer.findOneAndUpdate({ _id: id }, custUpdate, {
      new: true,
    });
    return {
      code: 200,
      message: "Succesful",
      data: result,
    };
  } catch (error) {
    console.log("Error in updateCustomer", error);
    return {
      code: 500,
      message: "Internal server error",
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
};
