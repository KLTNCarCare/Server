const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");
const accountSchema = mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  username: {
    type: String,
    match: [phoneNumberRegex, "Username must be a string of 10 digits"],
    required: true,
    unique: true,
    immutable: true,
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["admin", "customer", "staff"],
    required: true,
    immutable: true,
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});
accountSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
