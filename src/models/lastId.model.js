const mongoose = require("mongoose");
const lastIdSchema = mongoose.Schema({
  modelCode: {
    type: String,
    required: true,
    enum: ["NV","TK", "KH","SP"],
  },
  lastId: {
    type: Number,
    required: true,
  },
});
const LastId = mongoose.model("LastId", lastIdSchema);

module.exports = LastId;
