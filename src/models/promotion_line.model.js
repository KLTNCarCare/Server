const mongoose = require("mongoose");
const Promotion = require("./promotion.model");
const { increaseLastId } = require("../services/lastID.service");
const detailSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
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
    required: true,
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
    enum: ["active", "inactive", "deteled", "expires"],
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
lineSchema.pre("save", async function (next) {
  try {
    const parent = await Promotion.findOne({ _id: this.parentId });
    if (!parent) {
      return next(new Error("Promotion not found"));
    }
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const parentStartDate = new Date(parent.startDate);
    const parentEndDate = new Date(parent.endDate);
    if (startDate < parentStartDate || endDate > parentEndDate) {
      return next(
        new Error(
          "Valid range : parent.startDate <  startDate < endDate < parent.endDate"
        )
      );
    }
    next();
  } catch (error) {
    next(error);
  }
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
// inscrease Last id
const PromotionLine = mongoose.model("Promotion_line", lineSchema);
module.exports = PromotionLine;
