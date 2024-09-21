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
  },
  inStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
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

productSchema.pre("findOneAndUpdate", function (next) {
  this._update.updatedAt = new Date();
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
