const Appointment = require("../models/appointment.model");
const start_work = Number(process.env.START_WORK);
const end_work = Number(process.env.END_WORK);
const interval = Number(process.env.INTERVAL);
const limit_slot = Number(process.env.LIMIT_SLOT);
const countAppointmentAtTime = async (time) =>
  await Appointment.countDocuments({
    startTime: { $lte: time },
    endTime: { $gte: time },
  });
const findAppointmentInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    {
      $match: {
        $or: [
          { startTime: { $gte: d1, $lt: d2 } },
          { endtTime: { $gt: d1, $lte: d2 } },
          { startTime: { $lte: d1 }, endTime: { $gte: d2 } },
        ],
      },
    },
    {
      $sort: {
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
// tham số có giá trị là timestamp
const groupSlotTimePoint = async (list_booking, start, end) => {
  const result = [];
  for (
    let time_point = start;
    time_point < end;
    time_point += interval * 60 * 60 * 1000
  ) {
    const hour_current =
      new Date(time_point).getHours() + new Date(time_point).getMinutes() / 60;
    // bỏ qua khung giờ [start_work:end_work)
    if (hour_current < start_work || hour_current >= end_work) continue;
    //đếm slot
    const slot_time_point = list_booking.filter(
      (ele) =>
        time_point >= new Date(ele.startTime.getTime()) &&
        time_point < new Date(ele.endTime).getTime()
    ).length;
    result.push(slot_time_point);
  }
  return result;
};
const getTimePointAvailableBooking = async (date, duration) => {
  const date_booking = new Date(date);
  date_booking.setHours(0, 0, 0, 0);
  const t1 = date_booking.getTime() + start_work * 60 * 60 * 1000;
  const t2 =
    date_booking.getTime() +
    (24 + (start_work + duration - interval)) * 60 * 60 * 1000;
  const booking_exist = await findAppointmentInRangeDate(
    new Date(t1),
    new Date(t2)
  );
  const slot_time_point = await groupSlotTimePoint(booking_exist, t1, t2);

  const time_available = [];
  for (let i = 0; i < (end_work - start_work) / interval; i++) {
    if (
      slot_time_point
        .slice(i, i + duration * 2)
        .some((num) => num >= limit_slot)
    )
      continue;
    time_available.push((i + 14) / 2);
  }
  return time_available;
};
const getAllSlotInDate = async (d) => {
  const date_booking = new Date(d);
  date_booking.setHours(0, 0, 0, 0);
  const t1 = date_booking.getTime() + start_work * 60 * 60 * 1000;
  const t2 = date_booking.getTime() + end_work * 60 * 60 * 1000;
  const booking_exist = await findAppointmentInRangeDate(
    new Date(t1),
    new Date(t2)
  );
  const slot_list = await groupSlotTimePoint(booking_exist, t1, t2);
  const result = slot_list.map((slot, index) => ({
    time_point: (index + 14) / 2,
    slot_current: slot,
  }));
  return result;
};
const getAppointmentInDate = async (d) => {
  const date_booking = new Date(d);
  date_booking.setHours(0, 0, 0, 0);
  const t1 = date_booking.getTime() + start_work * 60 * 60 * 1000;
  const t2 = date_booking.getTime() + end_work * 60 * 60 * 1000;
  const result = await findAppointmentInRangeDate(new Date(t1), new Date(t2));
  return result;
};
module.exports = {
  createAppointment,
  countAppointmentAtTime,
  findAppointmentInRangeDate,
  updateStatusAppoinment,
  pushServiceToAppointment,
  pullServiceToAppointment,
  getTimePointAvailableBooking,
  groupSlotTimePoint,
  getAllSlotInDate,
  getAppointmentInDate,
};
