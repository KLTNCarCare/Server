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
const updateStatusAppoinment = async (id, status) =>
  await Appointment.findOneAndUpdate({ _id: id }, { status }, { new: true });
const pushServiceToAppointment = async (id, service) =>
  await Appointment.findOneAndUpdate(
    { _id: id },
    { $addToSet: { items: service } },
    { new: true }
  );
// chỉ được xoá service có status là pending
const pullServiceToAppointment = async (id, serviceId) =>
  await Appointment.updateOne(
    { _id: id },
    { $pull: { items: { serviceId: serviceId, status: "pending" } } },
    { new: true }
  );
module.exports = {
  createAppointment,
  countAppointmentAtTime,
  findAppointmentInRangeDate,
  updateStatusAppoinment,
  pushServiceToAppointment,
  pullServiceToAppointment,
};
