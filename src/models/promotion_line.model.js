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
    description: {
      type: String,
      required: false,
    },
    itemGiftId: {
      type: String,
      default: null,
    },
    bill: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    limitDiscount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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
lineSchema.post("save", async (doc) => {
  try {
    await increaseLastId("CTKMCT");
  } catch (error) {
    console.log("Error in increase last id", error);
  }
});
const PromotionLine = mongoose.model("Promotion_line", lineSchema);
module.exports = PromotionLine;
