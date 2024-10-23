const mongoose = require("mongoose");
const Appointment = require("../models/appointment.model");
const connection = require("./sockjs_manager");
const { messageType } = require("../utils/constants");
const { generateAppointmentID } = require("./lastID.service");
const { getProBill, getProService } = require("./promotion.service");
const { getStringClockToDate } = require("../utils/convert");
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
          { endTime: { $gt: d1, $lte: d2 } },
          { startTime: { $lte: d1 }, endTime: { $gte: d2 } },
        ],
        status: { $nin: ["canceled", "missed"] },
      },
    },
    {
      $sort: {
        startTime: 1,
        endTime: 1,
      },
    },
  ]);
const findAppointmentStatusNotCanceledCompletedInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    {
      $match: {
        $or: [
          { startTime: { $gte: d1, $lt: d2 } },
          { endTime: { $gt: d1, $lte: d2 } },
          { startTime: { $lte: d1 }, endTime: { $gte: d2 } },
          { status: "in-progress" },
        ],
        status: { $nin: ["canceled", "completed", "missed"] },
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
    // thêm endtime cho data
    //Kiểm tra thời gian đặt lịch hẹn
    const hour_start = start_time.getHours();
    const min_start = start_time.getMinutes();
    if (
      hour_start < start_work ||
      hour_start >= end_work ||
      (min_start != 0 && min_start != 30)
    ) {
      return { code: 400, message: "Giờ đặt sai định dạng", data: null };
    }
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
    if (
      (error.name = "ValidatorError" && error.errors && error.errors["items"])
    ) {
      return {
        code: 400,
        message: error.errors["items"].message,
        data: null,
      };
    }
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const createAppointmentOnSite = async (appointment) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const start_time = new Date(appointment.startTime);
    const total_duration = Number(appointment.total_duration);
    const end_timestamp = calEndtime(start_time.getTime(), total_duration);
    const end_time = new Date(end_timestamp);
    appointment.endTime = end_time;
    appointment.startActual = start_time;
    appointment.endActual = end_time;
    appointment.status = "in-progress";
    const existing_apps =
      await findAppointmentStatusNotCanceledCompletedInRangeDate(
        start_time,
        end_time
      );
    existing_apps.forEach((item) => {
      if ((item.status = "in-progress")) {
        item.startTime = item.startActual;
      }
    });
    const slot_booking = await groupSlotTimePoint(
      existing_apps,
      start_time.getTime(),
      end_time.getTime()
    );
    for (const [index, value] of slot_booking.entries()) {
      if (value < 6) {
        continue;
      }
      const time_full = new Date(
        start_time.getTime() + index * interval * 60 * 60 * 1000
      );
      const min_full = time_full.getMinutes() < 30 ? 0 : 30;
      time_full.setMinutes(min_full);
      return {
        code: 400,
        message: `Đã đầy lịch hẹn tại khung giờ ${getStringClockToDate(
          time_full
        )}.Thời gian còn lại chỉ phù hợp cho dịch vụ từ dưới ${
          (index + 1) * interval
        }h`,
        data: null,
      };
    }
    const time_promotion = new Date(appointment.startTime);
    const items = appointment.items.map((item) => item.serviceId);
    // áp dụng loại khuyến mãi dịch vụ
    const promotion_result = [];
    const list_pro_service = await getProService(time_promotion, items);
    if (list_pro_service.length > 0) {
      appointment.items.forEach((item) => {
        const pro = list_pro_service.find(
          (pro) => pro.itemId == item.serviceId
        );
        if (pro) {
          item.discount = pro.discount;
          promotion_result.push({
            promotion_line: pro.lineId,
            code: pro.code,
            description: pro.description,
            value: (item.price * pro.discount) / 100,
          });
        } else {
          item.discount = 0;
        }
      });
    }
    //áp dụng loại khuyến mãi hoá đơn
    const sub_total = appointment.items.reduce(
      (total, item) => (total += (item.price * item.discount) / 100),
      0
    );
    const pro_bill = await getProBill(time_promotion, sub_total);

    if (pro_bill) {
      appointment.discount = {
        per: pro_bill.discount,
        value_max: pro_bill.limitDiscount,
      };
      promotion_result.push({
        promotion_line: pro_bill.lineId,
        code: pro_bill.code,
        description: pro_bill.description,
        value:
          (sub_total * pro_bill.discount) / 100 > pro_bill.limitDiscount
            ? pro_bill.limitDiscount
            : (sub_total * pro_bill.discount) / 100,
      });
    }
    // tạo object hoá đơn
    appointment.promotion = promotion_result;
    appointment.appointmentId = await generateAppointmentID();
    const appointment_result = await Appointment.create(appointment);
    await session.commitTransaction();
    const data_response = await Appointment.findById(appointment_result._id);
    return {
      code: 200,
      message: "Successfully",
      data: data_response,
    };
  } catch (error) {
    console.log("Error in saveAppointmetOnSite: ", error);
    session.abortTransaction();
    if (
      (error.name = "ValidatorError" && error.errors && error.errors["items"])
    ) {
      return {
        code: 400,
        message: error.errors["items"].message,
        data: null,
      };
    }
    return {
      code: 500,
      message: "Internal server error",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const updateStatusAppoinment = async (id, status) => {
  let updateFields = { status };

  switch (status) {
    case "in-progress":
      updateFields.startActual = new Date();
      break;
    case "completed":
      updateFields.endActual = new Date();
      break;
  }

  return await Appointment.findOneAndUpdate({ _id: id }, updateFields, {
    new: true,
  });
};
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
        new Date(ele.startTime).getTime() <= time_point &&
        new Date(ele.endTime).getTime() > time_point
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
  if (result) {
    connection.sendMessageAllStaff(messageType.created_invoice_app, result);
  }
  return result;
};
const getAppointmentById = async (id) =>
  await Appointment.findOne({ _id: id }).lean();
const getAppointmentByServiceId = async (serviceId) =>
  await Appointment.findOne({ "items.serviceId": serviceId }).lean();
module.exports = {
  createAppointment,
  createAppointmentOnSite,
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
  getAppointmentByServiceId,
};
