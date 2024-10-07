const { type } = require("express/lib/response");
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
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);
const invoiceSchema = mongoose.Schema({
  customer: {
    type: customerSchema,
    required: true,
  },
  vehicle: {
    type: vehicleSchema,
    required: true,
  },
  total_duration: {
    type: Number,
    min: 0,
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
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
  items: {
    type: [serviceSchema],
    required: true,
  },
  total_price,
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
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
invoiceSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
