const mongoose = require("mongoose");
const { validate } = require("./promotion.model");
const itemSchema = mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      immutable: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);
const priceCatalogSchema = mongoose.Schema({
  priceId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  priceName: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validator: {
      validate: function (item) {
        return this.startDate < endDate;
      },
      message: "Ngày kết thúc không hợp lệ",
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted", "expires"],
    default: "inactive",
  },
  items: {
    type: [itemSchema],
    default: [],
    validate: {
      validator: function (items) {
        const itemIds = items.map((item) => item.itemId);
        return itemIds.length === new Set(itemIds).size;
      },
      message: "Dịch vụ trong một bảng giá phải là duy nhất",
    },
  },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});
// Pre save hook to update the updatedAt value
priceCatalogSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
// check range start date and end date
priceCatalogSchema.pre("save", function (next) {
  this.startDate.setHours(0, 0, 0, 0);
  this.endDate.setHours(23, 59, 59, 0);
  if (this.startDate >= this.endDate || Date.now() >= this.startDate) {
    return next(
      new Error(
        `Invalid: startDate = ${
          this.startDate
        }< now = ${Date.now()} < endDate = ${this.endDate}`
      )
    );
  }
  next();
});
const PriceCatalog = mongoose.model("PriceCatalog", priceCatalogSchema);
module.exports = PriceCatalog;
