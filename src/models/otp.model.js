const mongoose = require("mongoose");

const otpSchema = mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "5m",
  },
});

const Otp = mongoose.model("Otp", otpSchema);
module.exports = { Otp };
