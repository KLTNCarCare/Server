const cron = require("node-cron");
const { updateExpiresAppoinment } = require("./appointment.service");

const cronAppoinmentExpires = () => {
  console.log("cron start");

  cron.schedule("5,10,15,20,25,30,35,40,45,50,55 7-16 * * *", async () => {
    const now = new Date();
    const expireTime = new Date(now.getTime() - 15 * 60 * 1000);
    console.log("cron update expires appointment at ", now);
    await updateExpiresAppoinment(expireTime);
  });
};
module.exports = { cronAppoinmentExpires };
