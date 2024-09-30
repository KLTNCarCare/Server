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
      default: null,
    },
    model: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);
const serviceSchema = mongoose.Schema(
  {
    typeId: {
      type: String,
      required: true,
    },
    typeName: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: {
      type: String,
      required: true,
    },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progess", "completed", "canceled"],
      default: "pending",
    },
  },
  { _id: false }
);
const appointmentSchema = mongoose.Schema({
  customer: {
    type: customerSchema,
    required: true,
  },
  vehicle: {
    type: vehicleSchema,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
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
    default: "pending",
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
  items: {
    type: [serviceSchema],
    required: true,
  },
});
appointmentSchema.pre("findOneAndUpdate", function (next) {
  this.getUpdate().updatedAt = Date.now();
  next();
});
const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
