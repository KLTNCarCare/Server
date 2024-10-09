const LastId = require("../models/lastId.model");

const generateID = async (modelCode) => {
  let lastId = await LastId.findOne({ modelCode });
  if (!lastId) {
    lastId = await LastId.create({ modelCode: modelCode, lastId: 0 });
  }
  lastId.lastId += 1;
  if (lastId.lastId < 10) return lastId.modelCode + "000" + lastId.lastId;
  if (lastId.lastId < 100) return lastId.modelCode + "00" + lastId.lastId;
  if (lastId.lastId < 1000) return lastId.modelCode + "0" + lastId.lastId;
  return lastId.modelCode + lastId.lastId;
};
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
const resetInvoiceId = async () =>
  await LastId.findOneAndUpdate({ modelCode: "HD" }, { lastId: 0 });
const increaseLastId = async (modelCode) =>
  await LastId.findOneAndUpdate({ modelCode }, { $inc: { lastId: 1 } });
module.exports = {
  generateID,
  increaseLastId,
  generateInvoiceID,
  resetInvoiceId,
};
