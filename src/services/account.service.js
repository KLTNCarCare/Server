const Account = require("../models/account.model");
const bcrypt = require("bcrypt");
const { generateID } = require("./lastID.service");
const { findCustByPhone } = require("./customer.service");
const jwt = require("jsonwebtoken");
const { findStaffById } = require("./staff.services");
const { Otp } = require("../models/otp.model");
const saltRounds = 10;
const createAccountService = async (username, password, role, userId) => {
  // Hash password
  const hashPassword = await bcrypt.hash(password, saltRounds);
  // create accountId
  const accountId = await generateID("TK");
  return await Account.create({
    accountId: accountId,
    username,
    password: hashPassword,
    userId,
    role: role,
  });
};
const checkAccountExist = async (username) =>
  await Account.findOne({ username: username });

const getAccountByUsernamePassword = async (username, password) => {
  try {
    //check username
    const obj = await Account.findOne({
      username,
      role: { $in: ["admin", "staff"] },
    }).lean();
    console.log(obj);

    if (!obj) {
      return {
        code: 400,
        message: "Thông tin tài khoản hoặc mật khẩu không chính xác",
        data: null,
      };
    }
    const isMatch = await bcrypt.compare(password, obj.password);
    if (!isMatch) {
      return {
        code: 400,
        message: "Thông tin tài khoản hoặc mật khẩu không chính xác",
        data: null,
      };
    }

    const staff = await findStaffById(obj.userId);
    if (!staff) {
      return {
        code: 500,
        message: "Không tìm thấy thông tin nhân viên",
        data: null,
      };
    }
    const payload = {
      username: obj.username,
      role: obj.role,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_LIFE,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_LIFE,
    });
    const data = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      role: obj.role,
      username: obj.username,
      _id: staff._id,
      staffId: staff.staffId,
      phone: staff.phone,
      name: staff.name,
      dob: staff.dob,
      email: staff.email,
      address: staff.address,
    };
    return { code: 200, message: "Thành công", data: data };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const findAccountByUseranme = async (username) => {
  return await Account.findOne({ username: username });
};
const getAccountMapCustomer = async (username, password) => {
  try {
    const acc = await Account.findOne({
      username: username,
      role: "customer",
    }).lean();
    if (!acc) {
      return {
        code: 400,
        message: "Thông tin đăng nhập không chính xác",
        data: null,
      };
    }
    const isMatch = await bcrypt.compare(password, acc.password);
    if (!isMatch) {
      return {
        code: 400,
        message: "Thông tin đăng nhập không chính xác",
        data: null,
      };
    }
    const userInfo = await findCustByPhone(username);
    if (userInfo.code != 200) {
      return userInfo;
    }
    const payload = {
      username: acc.username,
      role: acc.role,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_LIFE,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_LIFE,
    });
    const objUser = userInfo.data.toObject();
    const result = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      ...objUser,
    };
    return { code: 200, message: "Đăng nhập thành công", data: result };
  } catch (error) {
    console.log("Error in getAccountMapCustomer", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const changePassword = async (username, oldPass, newPass, otp) => {
  try {
    const obj = await Account.findOne({ username: username }).lean();
    if (!obj) {
      return { code: 400, message: "Không tìm thấy tài khoản", data: null };
    }
    const isMatch = bcrypt.compare(oldPass, obj.password);
    if (!isMatch) {
      return { code: 400, message: "Sai mật khẩu", data: null };
    }
    if (otp != "111111") {
      return { code: 400, message: "OTP không hợp lệ", data: null };
    }
    const hashPass = await bcrypt.hash(newPass, saltRounds);
    await Account.findOneAndUpdate(
      { username: username },
      { $set: { password: hashPass } }
    );
    return { code: 200, message: "Thành công", data: null };
  } catch (error) {
    console.log("Error in changePassword", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
module.exports = {
  createAccountService,
  getAccountByUsernamePassword,
  checkAccountExist,
  getAccountMapCustomer,
  findAccountByUseranme,
  changePassword,
};
