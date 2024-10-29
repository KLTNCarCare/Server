const { default: mongoose } = require("mongoose");
const { refundInvoice } = require("./invoice.service");
const InvoiceRefund = require("../models/invoice_refund.model");
const { refundPromotion } = require("./promotion_result.service");
const moment = require("moment");

const createInvoiceRefund = async (id, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // lấy thông tin hoá đơn đồng thời cập nhật hoá đơn là đã hoàn trả
    let rootInvoice = await refundInvoice(id, { session });
    rootInvoice = rootInvoice.toObject();
    if (!rootInvoice) {
      return { code: 400, message: "Hoá đơn không tồn tại", data: null };
    }
    // hoàn trả khuyến mãi
    if (rootInvoice.promotion && rootInvoice.promotion.length > 0) {
      await refundPromotion(rootInvoice._id, { session });
    }
    //tạo object invoice refund
    delete rootInvoice._id;

    const invoiceRefund = {
      invoiceRefundId: "HDHT_" + moment().format("YYYYMMDDHHmmss"),
      reason: data.reason,
      ...rootInvoice,
    };
    console.log(rootInvoice, invoiceRefund);

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
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    session.endSession();
  }
};
module.exports = { createInvoiceRefund };
