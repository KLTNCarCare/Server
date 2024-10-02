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
const increaseLastId = async (modelCode) =>
  await LastId.findOneAndUpdate({ modelCode }, { $inc: { lastId: 1 } });
module.exports = {
  generateID,
  increaseLastId,
};
