const mongoose = require("mongoose");

const slotAvailabelSchema = mongoose.Schema({
  date: {
    type: Date,
    required: true,
    immutable: true,
  },
  slot_available: {
    type: [Number],
    validate: {
      validator: function (v) {
        return v.length === 20 && v.every((num) => num >= 0 && num <= 6);
      },
      message: (props) =>
        `slot_available must have exactly 20 elements,each between 0 and 6!`,
    },
    default: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const SlotAvailable = mongoose.model("Slot_available", slotAvailabelSchema);
module.exports = SlotAvailable;
