const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");

const categorySchema = mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deteted"],
    required: true,
    default: "active",
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

categorySchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
categorySchema.post("save", async function (doc) {
  try {
    await increaseLastId("GDV");
  } catch (error) {
    console.log(error);
  }
});
const Category = mongoose.model("Service_package", categorySchema);
module.exports = Category;
