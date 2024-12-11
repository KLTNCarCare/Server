const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");
const MongooseDelete = require("mongoose-delete");
const staffSchema = mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [phoneNumberRegex, "Số điện thoại không hợp lệ"],
  },
  email: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  dob: {
    type: Date,
    default: null,
  },
  isAccount: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});
staffSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
staffSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});
const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;
