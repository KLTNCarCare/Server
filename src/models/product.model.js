const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");

const productSchema = mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
    immutable: true,
  },
  inStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    default: "cái",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true,
    default: "active",
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
productSchema.post("save", async function (doc) {
  try {
    await increaseLastId("SP");
  } catch (error) {
    console.log(error);
  }
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
