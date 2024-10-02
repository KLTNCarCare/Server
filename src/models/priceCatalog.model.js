const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");
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
    immutable: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted"],
    default: "inactive",
  },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});
// Pre save hook to update the updatedAt value
priceCatalogSchema.pre("findOneAndUpdate", function (next) {
  this.getUpdate().updatedAt = Date.now();
  next();
});
// check range start date and end date
priceCatalogSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate || Date.now() >= this.startDate) {
    return next(new Error("Invalid date range"));
  }
  next();
});
// inscrease Last id
priceCatalogSchema.post("save", async (doc) => {
  try {
    await increaseLastId("BG");
  } catch (error) {
    console.log("Error in increase last id", error);
  }
});
const PriceCatalog = mongoose.model("PriceCatalog", priceCatalogSchema);
module.exports = PriceCatalog;
