const mongoose = require("mongoose");
const materialSchema = mongoose.Schema({
  materialId: {
    type: String,
    required: true,
    unique: true,
  },
  materialName: {
    type: String,
    required: true,
  },
  inventory: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true,
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Material = mongoose.model("Material", materialSchema);
module.exports = Material;
