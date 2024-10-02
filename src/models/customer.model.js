const mongoose = require("mongoose");

const customerSchema = {
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
    immutable: true,
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
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
};
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
