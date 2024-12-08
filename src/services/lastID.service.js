const LastId = require("../models/lastId.model");

const generateID = async (modelCode, session) => {
  let lastId = await LastId.findOne({ modelCode }, null, session);
  if (!lastId) {
    const initLastId = await LastId.create(
      [{ modelCode: modelCode, lastId: 0 }],
      session
    );
    lastId = initLastId[0];
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
const generateInvoiceID = async (session) => {
  let lastId = await LastId.findOne({ modelCode: "HD" }, null, session);
  if (!lastId) {
    const initLastId = await LastId.create(
      [{ modelCode: "HD", lastId: 0 }],
      session
    );
    lastId = initLastId[0];
  }
  lastId.lastId += 1;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
  await increaseLastId("HD", session);
  if (lastId.lastId < 10) {
    return "HD_" + y + m + d + "_0" + lastId.lastId;
  }
  return "HD_" + y + m + d + "_" + lastId.lastId;
};
const generateAppointmentID = async (session) => {
  let lastId = await LastId.findOne({ modelCode: "DH" }, null, session);
  if (!lastId) {
    const initLastId = await LastId.create(
      [{ modelCode: "DH", lastId: 0 }],
      session
    );
    lastId = initLastId[0];
  }
  lastId.lastId += 1;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
  await increaseLastId("DH", session);
  if (lastId.lastId < 10) {
    return "DH_" + y + m + d + "_0" + lastId.lastId;
  }
  return "DH_" + y + m + d + "_" + lastId.lastId;
};
const resetInvoiceAndAppointmentId = async () =>
  await LastId.findOneAndUpdate(
    { modelCode: { $in: ["HD", "DH"] } },
    { lastId: 0 }
  );
module.exports = {
  generateID,
  increaseLastId,
  generateInvoiceID,
  resetInvoiceAndAppointmentId,
  generateAppointmentID,
};
