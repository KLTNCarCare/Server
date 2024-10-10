const { default: mongoose, trusted } = require("mongoose");
const Appointment = require("../models/appointment.model");
const { findOneAndUpdate } = require("../models/promotion_line.model");
const { find } = require("../models/promotion.model");
const connection = require("./sockjs_manager");
const { messageType } = require("../utils/constants");
const start_work = Number(process.env.START_WORK);
const end_work = Number(process.env.END_WORK);
const interval = Number(process.env.INTERVAL);
const limit_slot = Number(process.env.LIMIT_SLOT);
const statusPriority = {
  confirmed: 1,
  pending: 2,
  "in-progress": 3,
  completed: 4,
  rescheduled: 5,
  missed: 6,
  canceled: 7,
};

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
const findAppointmentStatusNotCanceledInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    {
      $match: {
        $or: [
          { startTime: { $gte: d1, $lt: d2 } },
          { endtTime: { $gt: d1, $lte: d2 } },
          { startTime: { $lte: d1 }, endTime: { $gte: d2 } },
        ],
        status: { $ne: "canceled" },
      },
    },
    {
      $sort: {
        startTime: 1,
        endTime: 1,
      },
    },
  ]);
const findAppointmentInRangeDatePriorityStatus = async (d1, d2) =>
  await Appointment.aggregate([
    {
      // Đầu tiên, lọc các document theo khoảng thời gian
      $match: {
        $or: [
          { startTime: { $gte: d1, $lt: d2 } },
          { endTime: { $gt: d1, $lte: d2 } },
          { startTime: { $lte: d1 }, endTime: { $gte: d2 } },
        ],
      },
    },
    {
      // Thêm trường sortPriority dựa trên status
      $addFields: {
        sortPriority: {
          $switch: {
            branches: Object.entries(statusPriority).map(
              ([status, priority]) => ({
                case: { $eq: ["$status", status] },
                then: priority,
              })
            ),
            default: 0,
          },
        },
      },
    },
    {
      // Sắp xếp theo thời gian và ưu tiên của status
      $sort: {
        sortPriority: 1, // Sắp xếp theo sortPriority trước
        startTime: 1, // Sau đó sắp xếp theo startTime
        endTime: 1, // Và endTime nếu cần
      },
    },
    {
      // Nếu không cần trường sortPriority trong kết quả cuối
      $project: {
        sortPriority: 0,
      },
    },
  ]);

const createAppointment = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const start_time = new Date(data.startTime);
    const total_duration = Number(data.total_duration);
    const end_timestamp = calEndtime(start_time.getTime(), total_duration);
    const end_time = new Date(end_timestamp);
    data.endTime = end_time;
    const existing_apps = await findAppointmentStatusNotCanceledInRangeDate(
      start_time,
      end_time
    );
    const slot_booking = await groupSlotTimePoint(
      existing_apps,
      start_time.getTime(),
      end_time.getTime()
    );
    if (slot_booking.some((num) => num >= Number(process.env.LIMIT_SLOT))) {
      return {
        code: 400,
        message: "Khung giờ chọn đã đầy.Vui lòng chọn khung giờ khác",
        data: null,
      };
    }
    const result = await Appointment.create(data);
    await session.commitTransaction();
    return {
      code: 200,
      message: "Successfully",
      data: result,
    };
  } catch (error) {
    console.log("Error in saveAppointmet: ", error);
    session.abortTransaction();
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
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
// startTime is timestamp ,duration is number
const calEndtime = (startTime, duration) => {
  let endTime = startTime;
  let count = 0;
  while (count < duration) {
    if (new Date(endTime).getHours() == end_work) {
      endTime += (24 - (end_work - start_work) + interval) * 60 * 60 * 1000;
    } else {
      endTime += interval * 60 * 60 * 1000;
    }
    count += interval;
  }
  return endTime;
};
const getTimePointAvailableBooking_New = async (date, duration) => {
  const date_booking = new Date(date);
  date_booking.setHours(0, 0, 0, 0);
  const t1 = date_booking.getTime() + start_work * 60 * 60 * 1000;
  const start = date_booking.getTime() + end_work * 60 * 60 * 1000;
  const t2 = calEndtime(start, duration - interval);
  const booking_exist = await findAppointmentStatusNotCanceledInRangeDate(
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
  const booking_exist = await findAppointmentStatusNotCanceledInRangeDate(
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
  const result = await findAppointmentInRangeDatePriorityStatus(
    new Date(t1),
    new Date(t2)
  );
  return result;
};

const updateExpiresAppoinment = async (deadline) => {
  const expires = await Appointment.find({
    status: "pending",
    startTime: { $lte: deadline },
  });
  const ids = expires.map((ele) => ele._id);
  console.log(ids);
  await Appointment.updateMany(
    { _id: { $in: ids }, status: "pending" },
    { $set: { status: "missed" } }
  );
  return await Appointment.find({ _id: { $in: ids } });
};
const updateAppointmentCreatedInvoice = async (id) => {
  const result = await Appointment.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        invoiceCreated: true,
      },
    },
    { new: true }
  );
  console.log(result);

  if (result) {
    connection.sendMessageAllStaff(messageType.created_invoice_app, result);
  }
  return result;
};
const getAppointmentById = async (id) =>
  await Appointment.findOne({ _id: id }).lean();
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
  getTimePointAvailableBooking_New,
  calEndtime,
  updateExpiresAppoinment,
  getAppointmentById,
  updateAppointmentCreatedInvoice,
};
