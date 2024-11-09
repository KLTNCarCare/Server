const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");
const { increaseLastId } = require("../services/lastID.service");
const MongooseDelete = require("mongoose-delete");
const accountSchema = mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  username: {
    type: String,
    match: [phoneNumberRegex, "Số điện thoại không hợp lệ"],
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
accountSchema.pre(["findOneAndUpdate", "upDateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
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
accountSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
