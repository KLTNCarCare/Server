const { default: mongoose } = require("mongoose");
const { getProService, getProBill } = require("./promotion.service");
const { getPriceByServices } = require("./price_catalog.service");
const Invoice = require("../models/invoice.model");
const {
  getAppointmentById,
  updateAppointmentCreatedInvoice,
} = require("./appointment.service");
const Appointment = require("../models/appointment.model");
const { createPromotionResult } = require("./promotion_result.service");
const { generateInvoiceID } = require("./lastID.service");

const createInvoiceFromAppointmentId = async (appId) => {
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
    // Kiểm tra lịch hẹn đã tạo hoá đơn hay chưa
    // if (app.invoiceCreated != null && app.invoiceCreated == true) {
    //   return {
    //     code: 400,
    //     message: "Lịch hẹn này đã được tạo hoá đơn",
    //     data: null,
    //   };
    // }
    // lấy danh sách _id của dịch vụ
    const items = app.items.map((item) => item.serviceId);

    // lấy giá của dịch vụ theo thời gian lịch đã đặt
    const time_promotion = new Date(app.startTime);
    const list_price = await getPriceByServices(time_promotion, items);

    //Xuất lỗi khi có dịch vụ không lấy được giá
    if (list_price.length != items.length) {
      throw new Error("Không tìm thấy giá của dịch vụ");
    }
    //thêm giá vào từng dịch vụ
    app.items.forEach((item) => {
      const price = list_price.find((price) => price.itemId == item.serviceId);
      item.price = price.price;
    });
    // áp dụng loại khuyến mãi dịch vụ
    const list_pro_service = await getProService(time_promotion, items);
    if (list_pro_service.length > 0) {
      app.items.forEach((item) => {
        const pro = list_pro_service.find(
          (pro) => pro.itemId == item.serviceId
        );
        if (pro) {
          item.discount = pro.discount;
          promotion_result.push({
            promotion_line: pro.lineId,
            code: pro.code,
            value: (item.price * pro.discount) / 100,
          });
        } else {
          item.discount = 0;
        }
      });
    }
    //áp dụng loại khuyến mãi hoá đơn
    const sub_total = app.items.reduce(
      (total, item) => (total += (item.price * item.discount) / 100),
      0
    );
    sub_total;

    const pro_bill = await getProBill(time_promotion, sub_total);
    pro_bill;

    if (pro_bill) {
      app.discount = {
        per: pro_bill.discount,
        value_max: pro_bill.limitDiscount,
      };
      promotion_result.push({
        promotion_line: pro_bill.lineId,
        code: pro_bill.code,
        value:
          (sub_total * pro_bill.discount) / 100 > pro_bill.limitDiscount
            ? pro_bill.limitDiscount
            : (sub_total * pro_bill.discount) / 100,
      });
    }
    // tạo object hoá đơn
    const promotion_code = promotion_result.map((item) => item.code);
    const invoiceId = await generateInvoiceID();

    const data = {
      invoiceId: invoiceId,
      appointmentId: appId,
      customer: app.customer,
      vehicle: app.vehicle,
      items: app.items,
      discount: app.discount,
      promotion_code: promotion_code,
    };
    // lưu hoá đơn
    const result = await Invoice.create(data);
    // cập nhật appointment đã được tạo invoice
    await updateAppointmentCreatedInvoice(appId);
    // lưu kết quả khuyến mãi
    if (promotion_result.length > 0) {
      for (let pro of promotion_result) {
        await createPromotionResult({ ...pro, invoice: result._id });
      }
    }
    session.commitTransaction();
    const getInvoice = await findInvoiceById(result._id);
    return {
      code: 200,
      message: "Successfully",
      data: getInvoice,
    };
  } catch (error) {
    session.abortTransaction();
    error;

    return {
      code: 500,
      message: "Internal server error",
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
    const result = await Invoice.aggregate([
      { $match: {} },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      {
        $project: {
          totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          data: 1,
        },
      },
    ]);
    return {
      code: 200,
      message: "Successful",
      data: {
        totalPage: Math.ceil(result[0].totalCount / limit),
        totalCount: result[0].totalCount,
        data: result[0].data,
      },
    };
  } catch (error) {
    error;
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
