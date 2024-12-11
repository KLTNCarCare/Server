const { default: mongoose } = require("mongoose");
const { generateID, increaseLastId } = require("./lastID.service");
const Staff = require("../models/staff.model");
const Account = require("../models/account.model");

const createStaff = async (staff) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    staff.staffId = await generateID("NV", { session });
    await increaseLastId("NV", { session });
    const result = await Staff.create([staff], { session });
    await session.commitTransaction();
    return { code: 200, message: "Thành công", data: result[0] };
  } catch (error) {
    console.log("Error in createStaff", error);
    await session.abortTransaction();
    if (error.code == 11000) {
      return status400("Số điện thoại đã tồn tại");
    }
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    await session.endSession();
  }
};
const deleteStaff = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const obj = await Staff.findById(id).lean();
    if (!obj) {
      return status400("Không tìm thấy nhân viên");
    }
    await Account.delete({ username: obj.phone }, { session });
    await Staff.delete(
      { _id: id },

      { session }
    );
    await session.commitTransaction();
    return status200(null);
  } catch (error) {
    console.log("Error in deleteStaff");
    session.abortTransaction();
    return status500;
  } finally {
    await session.endSession();
  }
};
const updateStaff = async (id, data) => {
  try {
    delete data.phone;
    delete data.isAccount;
    const result = await Staff.findOneAndUpdate(
      { _id: id },
      {
        $set: data,
      },
      { new: true }
    );
    console.log(result);

    if (!result) {
      return status400("Không tìm thấy nhân viên");
    }
    return status200(null);
  } catch (error) {
    console.log("Error in updateStaff", error);
    return status500;
  }
};
const updatePhone = async (id, phone) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const obj = await Staff.findById(id).lean();
    if (!obj) {
      return status400("Không tìm thấy nhân viên");
    }
    if (obj.isAccount) {
      await Account.findOneAndUpdate(
        { usename: phone },
        {
          $set: {
            username: phone,
          },
        },
        { session }
      );
    }
    const result = await Staff.findOneAndUpdate(
      { _id: id },
      { $set: { phone: phone } },
      { new: true, session }
    );
    await session.commitTransaction();
    return status200(result);
  } catch (error) {
    console.log("Error in updatePhone", error);
    await session.abortTransaction();
    if (error.code == 11000) {
      return status400("Số điện thoại đã tồn tại");
    }
    return status500;
  } finally {
    await session.endSession();
  }
};
const grantAccount = async (id, password) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const obj = await Staff.findById(id).lean();
    if (!obj) {
      return status400("Không tìm thấy nhân viên");
    }
    if (obj.isAccount) {
      return status400("Nhân viên đã có tài khoản");
    }
    const result = await Staff.findOneAndUpdate(
      { _id: id },
      { $set: { isAccount: true } },
      { new: true, session }
    );
    const { createAccountService } = require("./account.service");
    await createAccountService(obj.phone, password, "staff", obj._id);
    await session.commitTransaction();
    return status200(null);
  } catch (error) {
    console.log("Error in grantAccount", error);
    await session.abortTransaction();
    return status500;
  } finally {
    await session.endSession();
  }
};
const revokeAccount = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await Staff.findOneAndUpdate(
      { _id: id },
      { $set: { isAccount: false } },
      { new: true, session }
    );
    if (!result) {
      return status400("Không tìm thấy nhân viên");
    }
    await Account.deleteOne({ username: result.phone }, { session });
    await session.commitTransaction();
    return status200(null);
  } catch (error) {
    console.log("Error in revokeAccount", error);
    await session.abortTransaction();
    return status500;
  } finally {
    await session.endSession();
  }
};
const findAllStaff = async (page, limit, field, word) => {
  try {
    const filter = {};
    if (field && word) {
      filter[field] = RegExp(word, "ui");
    }
    const totalCount = await Staff.countDocuments(filter);
    const pipeline = [
      { $match: filter },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $addFields: {
          userId: { $toString: "$_id" },
        },
      },

      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "userId",
          as: "account",
        },
      },
      {
        $unwind: {
          path: "$account",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          role: { $ifNull: ["$account.role", "staff"] },
        },
      },
      {
        $project: {
          account: 0,
          deleted: 0,
          deletedAt: 0,
          __v: 0,
          userId: 0,
        },
      },
    ];
    const result = await Staff.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: {
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / limit),
        data: result,
      },
    };
  } catch (error) {
    console.log("Error in findAllStaff", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: {
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / limit),
        data: null,
      },
    };
  }
};
const findStaffById = async (id) => await Staff.findById(id).lean();
const status500 = { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
const status400 = (mess) => ({ code: 400, message: mess, data: null });
const status200 = (data) => ({ code: 200, message: "Thành công", data: data });
module.exports = {
  createStaff,
  deleteStaff,
  updateStaff,
  updatePhone,
  grantAccount,
  revokeAccount,
  findAllStaff,
  findStaffById,
};
