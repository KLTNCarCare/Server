const mongoose = require("mongoose");
const { invoiceSchema } = require("./invoice.model");
const paymentSchema = mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cash", "transfer"],
      required: true,
    },
    e_invoice_code: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (this.method != "cash" && !value) {
            return false;
          }
          return true;
        },
        message:
          "Cần mã hoá đơn điên tử cho các phương thức thanh toán điện tử",
      },
    },
  },
  { _id: false }
);
const invoiceRefundSchema = mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  invoice: {
    type: invoiceSchema,
    required: true,
    immuatable: true,
  },
  reason: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return value.trim().length >= 5;
      },
      message: "Lý do hoàn trả quá ngắn",
    },
  },
  payment: {
    type: paymentSchema,
    required: true,
    immutable: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});
const InvoiceRefund = mongoose.model("Invoice_refund", invoiceRefundSchema);
module.exports = InvoiceRefund;
