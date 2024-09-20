const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");
const { increaseLastId } = require("../services/lastID.service");
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
accountSchema.pre("findByIdAndUpdate", function (next) {
  this.getUpdate().updatedAt = Date.now();
  next();
});
// inscrease Last id
accountSchema.post("save", async (doc) => {
  try {
    await increaseLastId("TK");
  } catch (error) {
    console.log("Error in increase last id", error);
  }
});
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
