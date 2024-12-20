const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const detailSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      immutable: true,
      unique: true,
    },
    itemId: {
      type: String,
      default: null,
    },
    itemName: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    itemGiftId: {
      type: String,
      default: null,
    },
    itemGiftName: {
      type: String,
      default: null,
    },
    bill: {
      type: Number,
      min: 0,
      default: null,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    limitDiscount: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);
const lineSchema = new mongoose.Schema({
  lineId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  code: {
    type: String,
    required: true,
    immutable: true,
    unique: true,
  },
  parentId: {
    type: String,
    required: true,
    immutable: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["discount-service", "discount-bill"],
  },
  description: {
    type: String,
    default: "",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  detail: {
    type: [detailSchema],
    default: [],
    validate: {
      validator: function (items) {
        if (this.type == "discount-service") {
          if (items.length > 0) {
            for (let item of items) {
              if (
                !item.itemId ||
                !item.itemGiftId ||
                !item.itemName ||
                !item.itemGiftName
              ) {
                return false;
              }
            }
            return true;
          }
        } else if (this.type == "discount-bill") {
          if (items.length > 0) {
            for (let item of items) {
              if (!item.bill || !item.limitDiscount) {
                return false;
              }
            }
            return true;
          }
        }
        return true;
      },
      message: "Thiếu dữ liệu chi tiết giảm giá",
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted", "expires"],
    default: "inactive",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
// modify updatedAt
lineSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});

lineSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: true });
const PromotionLine = mongoose.model("Promotion_line", lineSchema);
module.exports = PromotionLine;
