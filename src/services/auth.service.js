const jwt = require("jsonwebtoken");
const { Otp } = require("../models/otp.model");

const getSecondLeftToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    const currentTime = Math.floor(Date.now() / 1000); //đơn vị giây
    const timeLeft = decoded.exp - currentTime;
    return timeLeft;
  }
};
const createOTP = async (phone) => {
  const otp = _generateOTP();
  console.log(otp);

  //send otp
  //save otp to database
  return await Otp.create({
    phoneNumber: phone,
    code: otp,
  });
};
const verifyOTP = async (phone, otpFE) => {
  const otpBE = await Otp.findOne({ phoneNumber: phone });
  if (!otpBE) return { code: 404, message: "Mã OTP hết hạn." };
  if (otpBE.code != otpFE) return { code: 400, message: "Mã OTP không khớp." };
  return { code: 200, message: "Xác thực thành công." };
};
const _generateOTP = () => Math.floor(100000 + Math.random() * 900000);
module.exports = { getSecondLeftToken, createOTP, verifyOTP };
