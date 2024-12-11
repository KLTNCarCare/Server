const admin = require("../config/firebaseAdmin");
const { Otp } = require("../models/otp.model");
const axios = require("axios");

const sendOTP = async (phoneNumber, recaptchaToken) => {
  try {
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );
    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      throw new Error("Failed reCAPTCHA verification");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpEntry = new Otp({ phoneNumber, code: otp });
    await otpEntry.save();
    return {
      code: 200,
      message: "OTP đã được gửi !!",
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      code: 500,
      message: "Lỗi trong việc gửi OTP",
      error: error.message,
    };
  }
};

module.exports = {
  sendOTP,
};
