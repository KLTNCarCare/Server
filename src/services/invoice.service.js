const { default: mongoose } = require("mongoose");
const { getProService, getProBill } = require("./promotion.service");
const { getPriceByServices } = require("./price_catalog.service");
const Invoice = require("../models/invoice.model");
const { getAppointmentById } = require("./appointment.service");
const Appointment = require("../models/appointment.model");

const createInvoiceFromAppointmentId = async (appId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await getAppointmentById(appId);
    // Không tìm thấy appointment
    if (!app) {
      return {
        code: 400,
        message: "Dont find appointment with _id " + appId,
        data: null,
      };
    }
    app.vehicle = {
      model: "haha",
      licensePlate: "12345",
    };
    const items = app.items.map((item) => item.serviceId);
    console.log(items, app);

    const time_promotion = new Date(app.startTime);
    const list_price = await getPriceByServices(time_promotion, items);

    //Xử lý khi có dịch vụ không có giá
    if (list_price.length != items.length) {
      throw new Error("Không tìm thấy giá của dịch vụ");
    }
    //tạo giá
    app.items.forEach((item) => {
      const price = list_price.find((price) => price.itemId == item.serviceId);
      item.price = price.price;
    });
    // áp dụng khuyến mãi dịch vụ
    const list_pro_service = await getProService(time_promotion, items);
    app.items.forEach((item) => {
      const discount = list_pro_service.find(
        (pro) => pro.itemId == item.serviceId
      );
      item.discount = discount == null ? 0 : discount.discount;
    });
    //áp dụng khuyến mãi hoá đơn
    const sub_total = app.items.reduce(
      (total, item) => (total += (item.price * item.discount) / 100),
      0
    );
    const pro_bill = await getProBill(time_promotion, sub_total);
    if (pro_bill) {
      app.discount = {
        per: pro_bill.discount,
        value_max: pro_bill.limitDiscount,
      };
    }

    //
    const invoice = {
      appointmentId: appId,
      customer: app.customer,
      vehicle: app.vehicle,
      items: app.items,
      discount: app.discount,
    };
    const result = await Invoice.create(invoice);

    session.commitTransaction();
    return {
      code: 200,
      message: "Successfully",
      data: result,
    };
  } catch (error) {
    session.abortTransaction();
    console.log(error);

    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const findAllInvoice = async () => await Invoice.find();
module.exports = { createInvoiceFromAppointmentId, findAllInvoice };
