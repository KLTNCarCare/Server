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
    const invoiceRefund = {
      invoiceRefundId: "HDHT_" + moment().format("YYYYMMDDHHmmss"),
      reason: data.reason,
      invoice: rootInvoice,
    };
    const result = await InvoiceRefund.create([invoiceRefund], { session });
    await session.commitTransaction();
    return { code: 200, message: "Thành công", data: result[0] };
  } catch (error) {
    console.log("Error in create refund invoice ", error);
    await session.abortTransaction();
    if (error.code == 11000 && error.keyValue["invoice.invoiceId"]) {
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
    }
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  } finally {
    session.endSession();
  }
};
const findAllInvoiceRefund = async (page, limit, field, word) => {
  try {
    const filter = { status: { $ne: "deleted" } };
    if (field && word) {
      filter[field] = RegExp(word, "iu");
    }
    const totalCount = await InvoiceRefund.countDocuments(filter);
    const result = await InvoiceRefund.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPage = Math.ceil(totalCount / limit);
    return {
      code: 200,
      message: "Thành công",
      totalCount,
      totalPage,
      data: result,
    };
  } catch (error) {
    console.log("Error in get all invoice refund", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};

module.exports = { createInvoiceRefund, findAllInvoiceRefund };
