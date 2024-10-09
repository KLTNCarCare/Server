const cron = require("node-cron");
const { updateExpiresAppoinment } = require("./appointment.service");

const cronJob = cron.schedule(
  "15,45 7-16 * * *",
  async () => {
    try {
      const now = new Date();
      const expireTime = new Date(now.getTime() - 14.95 * 60 * 1000);
      const result = await updateExpiresAppoinment(expireTime);
      console.log(`Update ${result.modifiedCount} appointment at ${now}`);
    } catch (error) {
      console.log(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);
module.exports = { cronJob };
