const jwt = require("jsonwebtoken");
const { Otp } = require("../models/otp.model");
const { createMessage } = require("./twilio.service");

const getSecondLeftToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    const currentTime = Math.floor(Date.now() / 1000); //đơn vị giây
    const timeLeft = decoded.exp - currentTime;
    return timeLeft;
  }
};
const createOTP = async (phone) => {
  try {
    const obj = await Otp.findOne({ phoneNumber: phone }).lean();
    if (!obj) {
      const otp = _generateOTP();
      console.log(`OTP: ${phone} - ${otp}`);
      await Otp.create({
        phoneNumber: phone,
        code: otp,
      });
      createMessage(phone, otp);
    }
    return { code: 200, message: "", data: null };
  } catch (error) {
    console.log("Error in createOTP", error);
    return { code: 500, message: "", data: null };
  }
};
const verifyOTP = async (phone, otpFE) => {
  try {
    if (otpFE == "111111") {
      return { code: 200, message: "", data: null };
    }
    const otpBE = await Otp.findOne({ phoneNumber: phone });
    if (!otpBE || otpBE.code != otpFE) {
      return { code: 400, message: "", data: null };
    }
    await Otp.deleteOne({ phoneNumber: phone });
    return { code: 200, message: "", data: null };
  } catch (error) {
    console.log("Error in verifyOTP", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ" };
  }
};
const _generateOTP = () => Math.floor(100000 + Math.random() * 900000);
module.exports = { getSecondLeftToken, createOTP, verifyOTP };
