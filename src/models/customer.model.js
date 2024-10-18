const mongoose = require("mongoose");
const vehicleSchema = mongoose.Schema(
  {
    model: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);
const customerSchema = mongoose.Schema({
  custId: {
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
  vehicles: {
    type: [vehicleSchema],
    required: true,
    minlenght: [1, "Khách hàng hàng phải có ít nhất một thông tin xe"],
  },
  status: {
    type: String,
    enum: ["active", "inactive,deleted"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});
customerSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
