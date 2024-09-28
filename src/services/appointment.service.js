const mongoose = require("mongoose");

const customerSchema = mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },

    name: { type: String, required: true },
  },
  { _id: false }
);
const vehicleSchema = mongoose.Schema(
  {
    licensePlate: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);
const serviceSchema = mongoose.Schema({
  typeId: {
    type: String,
    required: true,
  },
  typeName: { type: String, required: true },
  servieId: { type: String },
  serviceName: {
    type: String,
  },
  price: { type: double },
});
const appointmentSchema = mongoose.Schema({
  customer: {
    type: customerSchema,
    required: true,
  },
  vehicle: {
    type: vehicleSchema,
    required: true,
  },
  notes: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "in-progress",
      "completed",
      "canceled",
      "no-show",
      "reschuduled",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  items: {
    type: serviceSchema,
    required: true,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
