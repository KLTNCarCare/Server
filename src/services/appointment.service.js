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
          { startTime: { $gte: d1, $lte: d2 } },
          { endtTime: { $gte: d1, $lte: d2 } },
        ],
      },
    },
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
// tham số có giá trị là timestamp
const groupSlotTimePoint = async (list_booking, start, end) => {
  const result = [];
  for (
    let time_point = start;
    time_point < end;
    time_point += interval * 60 * 60 * 1000
  ) {
    const hour_current = new Date(time_point).getHours();
    // bỏ qua khung giờ [5:7)
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
  const t1 = new Date(date_booking);
  const t2 = new Date(date_booking);
  t1.setHours(start_work, 0, 0, 0);
  t2.setDate(date_booking.getDate() + 1);
  t2.setHours(start_work + duration - interval, 0, 0, 0);
  const booking_exist = await findAppointmentInRangeDate(t1, t2);
  console.log("booking", booking_exist.length);
  const slot_time_point = await groupSlotTimePoint(
    booking_exist,
    t1.getTime(),
    t2.getTime()
  );

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
module.exports = {
  createAppointment,
  countAppointmentAtTime,
  findAppointmentInRangeDate,
  updateStatusAppoinment,
  pushServiceToAppointment,
  pullServiceToAppointment,
  getTimePointAvailableBooking,
  groupSlotTimePoint,
};
