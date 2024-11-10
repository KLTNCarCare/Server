const { sendOTP } = require("../services/otp.service");

const sendOtpToUser = async (req, res) => {
  const { phoneNumber, recaptchaToken } = req.body;

  const result = await sendOTP(phoneNumber, recaptchaToken);

  return res.status(result.code).json(result);
};

module.exports = {
  sendOtpToUser,
};
