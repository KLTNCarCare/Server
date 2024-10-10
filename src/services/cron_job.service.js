const cron = require("node-cron");
const { updateExpiresAppoinment } = require("./appointment.service");
const { resetInvoiceId } = require("./lastID.service");
const connection = require("./sockjs_manager");
const cronJobExpiresAppointment = cron.schedule(
  // "15,45 7-16 * * *",
  "30 * * * * *",
  async () => {
    try {
      const now = new Date();
      const expireTime = new Date(now.getTime() - 14.95 * 60 * 1000);
      const result = await updateExpiresAppoinment(expireTime);
      if (result.length > -1) {
        connection.sendMessageAllStaff("MISSED-APPOINTMENT", result);
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
      await resetInvoiceId();
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
module.exports = { cronJobExpiresAppointment, cronJobResetIdInvoice };
