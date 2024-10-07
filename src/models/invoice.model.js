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
  },
  { _id: false }
);
serviceSchema.virtual("total").get(function () {
  return this.price * (1 - this.discount / 100);
});
const paymentSchema = mongoose.Schema({
  method: {
    type: String,
    enum: ["cast", "bank-transfer", "digital-wallet"],
    default: "cast",
  },
  status: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
});
const invoiceSchema = mongoose.Schema({
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
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
  items: {
    type: [serviceSchema],
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  payment: {
    type: paymentSchema,
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
invoiceSchema.virtual("sub_total").get(function () {
  return this.items.reduce((total, service) => total + service.total, 0);
});

invoiceSchema.virtual("final_total").get(function () {
  return this.sub_total * (1 - this.discount / 100);
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
