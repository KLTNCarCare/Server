const Appointment = require("../models/appointment.model");

const countAppointmentAtTime = async (time) =>
  await Appointment.countDocuments({
    startTime: { $lte: time },
    endTime: { $gte: time },
  });
const findAppointmentInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    { $match: { startTime: { $gte: d1, $lte: d2 } } },
    {
      $project: {
        _id: 0,
        startTime: 1,
        endTime: 1,
      },
    },
  ]);
const createAppointment = async (data) => await Appointment.create(data);
module.exports = {
  createAppointment,
  countAppointmentAtTime,
  findAppointmentInRangeDate,
};
