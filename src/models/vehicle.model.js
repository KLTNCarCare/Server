const mongoose = require("mongoose");

const vehicleSchema = mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    immutable: true,
  },
  owner: {
    type: String,
    required: true,
    immutable: true,
  },
  licensePlate: {
    type: String,
    required: true,
  },
  model: {
    type: String,
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
const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
