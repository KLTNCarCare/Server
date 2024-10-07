const { default: mongoose } = require("mongoose");
const { getProService } = require("./promotion.service");
const { getPriceByServices } = require("./price_catalog.service");
const Invoice = require("../models/invoice.model");
const { getAppointmentById } = require("./appointment.service");

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
    const invoice = {
      customer: app.customer,
      vehicle: app.vehicle,
      items: app.items,
    };
    const result = await Invoice.create(invoice);
    const total_price = app.items.reduce(
      (total, item) => (total += item.price),
      0
    );

    const list_pro_service = await getProService(time_promotion, items);
    session.commitTransaction();
    return result;
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
module.exports = { createInvoiceFromAppointmentId };
