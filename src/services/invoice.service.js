const { default: mongoose } = require("mongoose");
const Invoice = require("../models/invoice.model");
const {
  getAppointmentById,
  updateAppointmentCreatedInvoice,
} = require("./appointment.service");
const Appointment = require("../models/appointment.model");
const { createPromotionResult } = require("./promotion_result.service");
const { generateInvoiceID } = require("./lastID.service");

const createInvoiceFromAppointmentId = async (appId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await getAppointmentById(appId);
    const promotion_result = [];
    // Không tìm thấy appointment
    if (!app) {
      return {
        code: 400,
        message: "Dont find appointment with _id " + appId,
        data: null,
      };
    }
    app.invoiceId = await generateInvoiceID();
    app.appointmentId = app._id;
    app.payment_method = paymentMethod;
    delete app._id;
    // lưu hoá đơn
    const result = await Invoice.create(app);
    // cập nhật appointment đã được tạo invoice
    await updateAppointmentCreatedInvoice(appId);
    console.log(app.promotion);

    // lưu kết quả khuyến mãi
    if (app.promotion.length > 0) {
      for (let pro of app.promotion) {
        await createPromotionResult({ ...pro, invoice: result._id });
      }
    }
    session.commitTransaction();
    const invoice = await findInvoiceById(result._id);
    return {
      code: 200,
      message: "Successfully",
      data: invoice,
    };
  } catch (error) {
    session.abortTransaction();
    console.log(error);

    return {
      code: 500,
      message: error.message,
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const updateInvoiceStatusToPaid = async (id) => {
  try {
    if (!id) {
      return { code: 400, message: "Bad request", data: null };
    }
    const result = await Invoice.findOneAndUpdate(
      { _id: id },
      { status: "paid" },
      { new: true }
    );
    if (!result) {
      return {
        code: 400,
        message: "Unsuccessful",
        data: result,
      };
    }
    return {
      code: 200,
      message: "Successful",
      data: result,
    };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Internal server error", data: null };
  }
};
const updateInvoiceTypeToRefund = async (id) => {
  try {
    if (!id) {
      return { code: 400, message: "Bad request", data: null };
    }
    const result = await Invoice.findOneAndUpdate(
      { _id: id },
      { type: "refund" },
      { new: true }
    );
    if (!result) {
      return {
        code: 400,
        message: "Unsuccessful",
        data: result,
      };
    }
    return {
      code: 200,
      message: "Successful",
      data: result,
    };
  } catch (error) {
    console.log(error);
    return { code: 500, message: "Internal server error", data: null };
  }
};
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
    return { code: 500, message: "Internal server error", data: null };
  }
};
const findInvoiceById = async (id) => await Invoice.findOne({ _id: id });
const findAllInvoice = async (page, limit) => {
  try {
    const result = await Invoice.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalCount = await Invoice.countDocuments();
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
      message: "Internal server error",
      data: null,
    };
  }
};

module.exports = {
  createInvoiceFromAppointmentId,
  findAllInvoice,
  findInvoiceByAppointmentId,
  updateInvoiceStatusToPaid,
  updateInvoiceTypeToRefund,
};
