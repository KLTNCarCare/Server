const cron = require("node-cron");
const { resetInvoiceAndAppointmentId } = require("./lastID.service");
const { refreshStatusPriceCatalog } = require("./price_catalog.service");
const { refreshStatusPromotionLine } = require("./promotion.service");
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
  cronJobResetIdInvoice,
  cronRefreshPriceCatalog,
  cronRefreshPromotionLine,
};
