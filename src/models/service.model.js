const mongoose = require("mongoose");
const serviceSchema = mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  categoryId: {
    type: String,
    required: true,
    immutable: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted"],
    default: "inactive",
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
serviceSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
