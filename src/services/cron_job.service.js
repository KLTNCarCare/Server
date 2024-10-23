const cron = require("node-cron");
const { updateExpiresAppoinment } = require("./appointment.service");
const { resetInvoiceAndAppointmentId } = require("./lastID.service");
const connection = require("./sockjs_manager");
const { messageType } = require("../utils/constants");
const { refreshStatusPriceCatalog } = require("./price_catalog.service");
const { refreshStatusPromotionLine } = require("./promotion.service");
const cronJobExpiresAppointment = cron.schedule(
  "15,45 7-16 * * *",
  async () => {
    try {
      const now = new Date();
      const expireTime = new Date(now.getTime() - 14.95 * 60 * 1000);
      const result = await updateExpiresAppoinment(expireTime);
      if (result.length > 0) {
        connection.sendMessageAllStaff(messageType.missed_app, result);
      }
      console.log(`Update ${result.length} appointment at ${now}`);
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);
const cronJobResetIdInvoice = cron.schedule(
  " 0 0 * * *",
  async () => {
    try {
      await resetInvoiceAndAppointmentId();
      console.log("Thiết lập lại bộ đếm hoá đơn trong ngày thành công!");
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);
const cronRefreshPriceCatalog = cron.schedule(
  " 0 0 * * *",
  async () => {
    await refreshStatusPriceCatalog();
    console.log(`Cập nhật trạng thái các bảng giá ngày:${new Date()} `);
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);
const cronRefreshPromotionLine = cron.schedule(
  " 0 0 * * *",
  async () => {
    await refreshStatusPromotionLine();
    console.log(`Cập nhật trạng thái các dòng khuyến mãi ngày:${new Date()} `);
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);
module.exports = {
  cronJobExpiresAppointment,
  cronJobResetIdInvoice,
  cronRefreshPriceCatalog,
  cronRefreshPromotionLine,
};
