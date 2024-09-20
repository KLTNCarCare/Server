const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");

const promotionSchema = new mongoose.Schema({
  promotionId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  promotionName: {
    type: String,
    required: true,
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
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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
  if (this.startDate >= this.endDate || Date.now() >= this.startDate) {
    return next(new Error("Valid range : Date now <  startDate < endDate"));
  }
  next();
});
promotionSchema.pre("findByIdAndUpdate", function (next) {
  this.getUpdate().updatedAt = Date.now();
  next();
});
// inscrease Last id
promotionSchema.post("save", async (doc) => {
  try {
    await increaseLastId("CTKM");
  } catch (error) {
    console.log("Error in increase last id", error);
  }
});
const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;
