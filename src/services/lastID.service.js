const LastId = require("../models/lastId.model");

const generateID = async (modelCode, session) => {
  let lastId = await LastId.findOne({ modelCode }, null, session);
  if (!lastId) {
    lastId = await LastId.create(
      [{ modelCode: modelCode, lastId: 0 }],
      session
    );
  }
  lastId.lastId += 1;
  if (lastId.lastId < 10) return lastId.modelCode + "000" + lastId.lastId;
  if (lastId.lastId < 100) return lastId.modelCode + "00" + lastId.lastId;
  if (lastId.lastId < 1000) return lastId.modelCode + "0" + lastId.lastId;
  return lastId.modelCode + lastId.lastId;
};
const increaseLastId = async (modelCode, session) =>
  await LastId.findOneAndUpdate(
    { modelCode },
    { $inc: { lastId: 1 } },
    session
  );
const generateInvoiceID = async () => {
  let lastId = await LastId.findOne({ modelCode: "HD" });
  if (!lastId) {
    lastId = await LastId.create({ modelCode: "HD", lastId: 0 });
  }
  lastId.lastId += 1;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
  await increaseLastId("HD");
  if (lastId.lastId < 10) {
    return "HD_" + y + m + d + "_0" + lastId.lastId;
  }
  return "HD_" + y + m + d + "_" + lastId.lastId;
};
const generateAppointmentID = async () => {
  let lastId = await LastId.findOne({ modelCode: "LH" });
  if (!lastId) {
    lastId = await LastId.create({ modelCode: "LH", lastId: 0 });
  }
  lastId.lastId += 1;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
  await increaseLastId("LH");
  if (lastId.lastId < 10) {
    return "LH_" + y + m + d + "_0" + lastId.lastId;
  }
  return "LH_" + y + m + d + "_" + lastId.lastId;
};
const resetInvoiceAndAppointmentId = async () =>
  await LastId.findOneAndUpdate(
    { modelCode: { $in: ["HD", "LH"] } },
    { lastId: 0 }
  );
module.exports = {
  generateID,
  increaseLastId,
  generateInvoiceID,
  resetInvoiceAndAppointmentId,
  generateAppointmentID,
};
