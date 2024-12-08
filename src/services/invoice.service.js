const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const { Invoice } = require("../models/invoice.model");
const {
  getAppointmentById,
  updateAppointmentCreatedInvoice,
  getAppointmentByAppointmentId,
  getAppointmentLeanById,
  createAppointmentRaw,
} = require("./appointment.service");
const {
  createPromotionResult,
  createManyPromotionResult,
} = require("./promotion_result.service");
const {
  generateInvoiceID,
  generateAppointmentID,
} = require("./lastID.service");
const { log } = require("console");
const Appointment = require("../models/appointment.model");
const { sendMessageAllStaff } = require("./sockjs_manager");
const { messageType } = require("../utils/constants");

const createInvoiceFromAppointmentId = async (appId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await getAppointmentLeanById(appId);
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
    const invoice = new Invoice(result[0]);
    return {
      code: 200,
      message: "Thành công",
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
const createInvoiceByAppointmentId = async (appId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await getAppointmentByAppointmentId(appId);
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
    console.log(app); //log

    const result = await Invoice.create([app], { session });
    console.log(result);

    // cập nhật appointment đã được tạo invoice
    await updateAppointmentCreatedInvoice(app.appointmentId, { session });
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
    return {
      code: 200,
      message: "Thành công",
      data: null,
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
      message: "Thành công",
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
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalCount = await Invoice.countDocuments(filter);
    return {
      code: 200,
      message: "Thành công",
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
const createInfoOrderMobile = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    data.appointmentId = await generateAppointmentID({ session });
    data.invoiceId = await generateInvoiceID({ session });
    data.payment_method = "transfer";
    data.promotion.forEach((element) => {
      element.promotion_line = element.lineId;
    });
    const appointmentResult = await createAppointmentRaw(data, { session });
    const invoiceResult = await Invoice.create([data], { session });
    if (!appointmentResult || !invoiceResult[0]) {
      throw new Error("create appointment, invoice mobile fail");
    }
    data.promotion.forEach((element) => {
      element.invoice = invoiceResult[0]._id;
    });
    await createManyPromotionResult(data.promotion, { session });
    sendMessageAllStaff(messageType.save_app, appointmentResult);
    sendMessageAllStaff(messageType.save_invoice, invoiceResult[0]);
    await session.commitTransaction();
    return { code: 200, message: "Thành công", data: appointmentResult };
  } catch (error) {
    console.log("Error in createInfoOrderMobile", error);
    await session.abortTransaction();
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  } finally {
    await session.endSession();
  }
};
module.exports = {
  createInvoiceFromAppointmentId,
  findAllInvoice,
  findInvoiceById,
  findInvoiceByAppointmentId,
  findInvoiceByCustId,
  refundInvoice,
  createInvoiceByAppointmentId,
  createInfoOrderMobile,
};
