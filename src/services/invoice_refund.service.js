const { default: mongoose } = require("mongoose");
const { findInvoiceById, refundInvoice } = require("./invoice.service");
const InvoiceRefund = require("../models/invoice_refund.model");
const { refundPromotion } = require("./promotion_result.service");

const createInvoiceRefund = async (id, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // lấy thông tin hoá đơn đồng thời cập nhật hoá đơn là đã hoàn trả
    const rootInvoice = await refundInvoice(id, { session });
    console.log(rootInvoice);
    if (!rootInvoice) {
      return { code: 400, message: "Hoá đơn không tồn tại", data: null };
    }
    // hoàn trả khuyến mãi
    if (rootInvoice.promotion && rootInvoice.promotion.length > 0) {
      await refundPromotion(rootInvoice._id, { session });
    }
    const invoiceRefund = {
      invoiceId: rootInvoice._id,
      invoice: rootInvoice,
      reason: data.reason,
      payment: data.payment,
    };
    const result = await InvoiceRefund.create([invoiceRefund], { session });
    await session.commitTransaction();
    return { code: 200, message: "Thành công", data: result[0] };
  } catch (error) {
    console.log("Error in create refund invoice ", error);
    await session.abortTransaction();
    if (error.code == 11000) {
      return { code: 400, message: "Hoá đơn đã có hoá đơn trả", data: null };
    }
    if (error.name == "ValidationError" && error.errors) {
      if (error.errors["reason"]) {
        return {
          code: 400,
          message: "Lý do hoàn trả quá ngắn",
          data: null,
        };
      }
      if (error.errors["payment.method"]) {
        return {
          code: 400,
          message:
            "Phương thức thanh toán không hợp lệ: " +
            error.errors["payment.method"].value,
          data: null,
        };
      }
      if (error.errors["payment.e_invoice_code"]) {
        return {
          code: 400,
          message:
            "Cần mã hoá đơn điên tử cho phương thức thanh toán chuyển khoản",
          data: null,
        };
      }
    }
    return { code: 500, message: "Internal server error", data: null };
  } finally {
    session.endSession();
  }
};
module.exports = { createInvoiceRefund };
