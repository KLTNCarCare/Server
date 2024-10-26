const { default: mongoose } = require("mongoose");
const { Invoice } = require("../models/invoice.model");
const {
  getAppointmentById,
  updateAppointmentCreatedInvoice,
} = require("./appointment.service");
const { createPromotionResult } = require("./promotion_result.service");
const { generateInvoiceID } = require("./lastID.service");
const { findOneAndUpdate } = require("../models/promotion.model");

const createInvoiceFromAppointmentId = async (appId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await getAppointmentById(appId);
    // Không tìm thấy appointment
    if (!app) {
      return {
        code: 400,
        message: "Không tìm thấy đơn hàng",
        data: null,
      };
    }
    if (app.invoiceCreated == true) {
      return {
        code: 400,
        message: "Đơn hàng đã có hoá đơn",
        data: null,
      };
    }
    app.invoiceId = await generateInvoiceID({ session });
    app.appointmentId = app._id;
    app.payment_method = paymentMethod;
    delete app._id;
    // lưu hoá đơn
    const result = await Invoice.create([app], { session });
    console.log(result);

    // cập nhật appointment đã được tạo invoice
    await updateAppointmentCreatedInvoice(appId, { session });
    // lưu kết quả khuyến mãi
    if (app.promotion.length > 0) {
      for (let pro of app.promotion) {
        await createPromotionResult(
          { ...pro, invoice: result[0]._id },
          {
            session,
          }
        );
      }
    }
    await session.commitTransaction();
    const invoice = await findInvoiceById(result[0]._id);
    return {
      code: 200,
      message: "Successfully",
      data: invoice,
    };
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    if (error.name == "ValidationError" && error.errors) {
      if (error.errors["payment_method"]) {
        return {
          code: 400,
          message:
            "Phương thức thanh toán không hợp lệ: " +
            error.errors["payment_method"].value,
          data: null,
        };
      }
      if (error.errors["e_invoice_code"]) {
        return {
          code: 400,
          message:
            "Cần mã hoá đơn điên tử cho phương thức thanh toán chuyển khoản",
          data: null,
        };
      }
    }
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const refundInvoice = async (id, session) =>
  await Invoice.findOneAndUpdate(
    { _id: id },
    { isRefund: true },
    { new: true, ...session }
  );
const findInvoiceByAppointmentId = async (appointmentId) => {
  try {
    if (!appointmentId) {
      return { code: 400, message: "Bad request", data: null };
    }
    const result = await Invoice.findOne({ appointmentId: appointmentId });
    return {
      code: 200,
      message: "Successful",
      data: result,
    };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const findInvoiceById = async (id) => await Invoice.findById(id).lean();
const findAllInvoice = async (page, limit, field, word) => {
  try {
    const filter = {};
    if (field && word) {
      filter[field] = RegExp(word, "iu");
    }
    const result = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalCount = await Invoice.countDocuments(filter);
    return {
      code: 200,
      message: "Successful",
      data: {
        data: result,
        totalPage: Math.ceil(totalCount / limit),
        totalCount: totalCount,
      },
    };
  } catch (error) {
    console.log(error);

    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const findInvoiceByCustId = async (custId) => {
  try {
    const result = await Invoice.find({ "customer.custId": custId }).sort({
      createdAt: -1,
    });
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in getInvoiceByCustId", error);
    return { code: 500, messasge: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
module.exports = {
  createInvoiceFromAppointmentId,
  findAllInvoice,
  findInvoiceById,
  findInvoiceByAppointmentId,
  findInvoiceByCustId,
  refundInvoice,
};
