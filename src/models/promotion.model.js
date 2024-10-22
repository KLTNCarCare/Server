const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");

const promotionSchema = new mongoose.Schema({
  promotionId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  promotionName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (item) {
        return startDate > new Date();
      },
      message: "Ngày bắt đầu phải lớn hơn ngày hiện tại",
    },
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (item) {
        return startDate < endDate;
      },
      message: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
promotionSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;
