const mongoose = require("mongoose");
const { increaseLastId } = require("../services/lastID.service");

const serviceSchema = mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
serviceSchema.pre("findOneAndUpdate", function (next) {
  this._update.updatedAt = new Date();
  next();
});
serviceSchema.post("save", async function (doc) {
  try {
    await increaseLastId("DV");
  } catch (error) {
    console.log(error);
  }
});
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
