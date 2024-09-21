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
  categoryType: {
    type: String,
    required: true,
    enum: ["service", "product"],
    immutable: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
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

categorySchema.pre("findOneAndUpdate", function (next) {
  this._update.updatedAt = new Date();
  next();
});
categorySchema.post("save", async function (doc) {
  try {
    await increaseLastId("LH");
  } catch (error) {
    console.log(error);
  }
});
const Category = mongoose.model("Categorie", categorySchema);
module.exports = Category;
