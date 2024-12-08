const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
const client = twilio(accountSid, authToken);

const createMessage = async (phone, code) => {
  try {
    const message = await client.messages.create({
      body: "AK Auto xin chào quý khách!Mã xác thực của quý khách là:" + code,
      from: twilioPhone,
      to: `+84${phone.slice(1)}`,
    });

    console.log(message.body);
  } catch (error) {
    console.log("Error in createMessage", error);
  }
};
module.exports = { createMessage };
