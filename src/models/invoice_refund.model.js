const mongoose = require("mongoose");
const { phoneNumberRegex } = require("../utils/regex");
const { invoiceSchema } = require("./invoice.model");

const invoiceRefundSchema = mongoose.Schema({
  invoiceRefundId: {
    type: String,
    unique: true,
    required: true,
    immutable: true,
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
  invoice: {
    type: invoiceSchema,
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
