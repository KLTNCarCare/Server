const mongoose = require("mongoose");
const promotionResultSchema = mongoose.Schema({
  invoice: {
    type: String,
    required: true,
    immutable: true,
  },
  promotion_line: {
    type: String,
    required: true,
    immutable: true,
  },
  code: {
    type: String,
    required: true,
    immutable: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    immutable: true,
  },
  type: {
    type: String,
    enum: ["normal", "refund"],
    default: "normal",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});
const PromotionResult = mongoose.model(
  "Promotion_result",
  promotionResultSchema
);
module.exports = PromotionResult;
