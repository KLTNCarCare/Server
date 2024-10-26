const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");

const customerSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    custId: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      match: [phoneNumberRegex, "Số điện thoại không hợp lệ"],
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
const discountSchema = mongoose.Schema(
  {
    per: {
      type: Number,
      default: 0,
      max: 100,
    },
    value_max: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
const PromotionSchema = mongoose.Schema(
  {
    promotion_line: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      min: 0,
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
  { _id: false, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);
serviceSchema.virtual("total").get(function () {
  const total = this.price * (1 - this.discount / 100);

  return total;
});
const invoiceSchema = mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
      required: true,
    },
    appointmentId: {
      type: String,
      default: null,
    },
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
    items: {
      type: [serviceSchema],
      required: true,
    },
    discount: {
      type: discountSchema,
      default: {
        per: 0,
        value_max: 0,
      },
    },
    promotion: {
      type: [PromotionSchema],
      default: [],
    },
    payment_method: {
      type: String,
      enum: ["cash", "transfer"],
      required: true,
    },
    e_invoice_code: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (this.payment_method != "cash" && !value) {
            return false;
          }
          return true;
        },
        message:
          "Cần mã hoá đơn điên tử cho phương thức thanh toán chuyển khoản",
      },
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
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);
invoiceSchema.virtual("sub_total").get(function () {
  return this.items.reduce(
    (total, service) => total + service.price * (1 - service.discount / 100),
    0
  );
});

invoiceSchema.virtual("final_total").get(function () {
  const value_max = this.discount.value_max;
  const sub_total = this.sub_total;
  const discountValue = (sub_total * this.discount.per) / 100;

  return discountValue > value_max
    ? sub_total - value_max
    : sub_total - discountValue;
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
module.exports = { Invoice, invoiceSchema };
