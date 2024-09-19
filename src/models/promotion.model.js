const e = require("cors");
const mongoose = require("mongoose");
const lineSchema = new mongoose.Schema({
  lineId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["gift-bill", "gift-service", "discount-service", "discount-product"],
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
  itemId: {
    type: String,
    default: null,
  },
  itemGiftId: {
    type: [String],
    default: null,
  },
  discount: {
    type: Number,
    default: 0,
  },
  limitDiscount: {
    type: Number,
    default: 0,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
});
const promotionSchema = new mongoose.Schema({
  promotionId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  descrioption: {
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
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  lines: {
    type: [lineSchema],
    default: [],
  },
  createdDate: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
});
promotionSchema.pre("save", function (next) {
  this.updatedDate = Date.now();
  next();
});
promotionSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate || Date.now() >= this.startDate) {
    return next(new Error("Valid range : Date now <  startDate < endDate"));
  }
  next();
});
promotionSchema.pre("save", function (next) {
  if (this.lines.length === 0) {
    return next(new Error("At least one line"));
  } else {
    for (const line of this.lines) {
      if (line.startDate < this.startDate || line.endDate > this.endDate) {
        return next(
          new Error(
            "Valid range : promotion.startDate < line.startDate < line.endDate < promotion.endDate"
          )
        );
      }
    }
  }
  next();
});
lineSchema.pre("save", function (next) {
  this.updatedDate = Date.now();
  next();
});
lineSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("Valid range : startDate < endDate"));
  }
  next();
});
const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;
