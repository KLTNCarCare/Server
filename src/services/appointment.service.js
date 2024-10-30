const mongoose = require("mongoose");
const validator = require("validator");
const Appointment = require("../models/appointment.model");
const connection = require("./sockjs_manager");
const { messageType } = require("../utils/constants");
const { generateAppointmentID } = require("./lastID.service");
const { getProBill, getProService } = require("./promotion.service");
const { getStringClockToDate } = require("../utils/convert");
const { findCustByPhone, createCustomer } = require("./customer.service");
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

const findAppointmentInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    {
      $match: {
        $or: [
          { startActual: { $gte: d1, $lt: d2 } },
          { endActual: { $gt: d1, $lte: d2 } },
          { startActual: { $lte: d1 }, endActual: { $gte: d2 } },
        ],
      },
    },
    {
      $sort: {
        startActual: 1,
        endActual: 1,
      },
    },
  ]);
const findAppointmentStatusNotCanceledCompletedInRangeDate = async (d1, d2) =>
  await Appointment.aggregate([
    {
      $match: {
        $or: [
          { startActual: { $gte: d1, $lt: d2 } },
          { endActual: { $gt: d1, $lte: d2 } },
          { startActual: { $lte: d1 }, endActual: { $gte: d2 } },
        ],
        status: { $nin: ["canceled", "completed"] },
      },
    },
    {
      $sort: {
        startActual: 1,
        endActual: 1,
      },
    },
  ]);
const findAppointmentInRangeDatePriorityStatus = async (d1, d2) =>
  await Appointment.aggregate([
    {
      // Đầu tiên, lọc các document theo khoảng thời gian
      $match: {
        $or: [
          { startActual: { $gte: d1, $lt: d2 } },
          { endActual: { $gt: d1, $lte: d2 } },
          { startActual: { $lte: d1 }, endActual: { $gte: d2 } },
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
        startActual: 1, // Sau đó sắp xếp theo startActual
        endActual: 1, // Và endActual nếu cần
      },
    },
    {
      // Nếu không cần trường sortPriority trong kết quả cuối
      $project: {
        sortPriority: 0,
      },
    },
  ]);
const findAppointmentDashboard = async (time) => {
  try {
    const today = new Date(time);
    today.setHours(0, 0, 0, 0);
    const appointments = await Appointment.aggregate(
      pipelineFindAppointmentDashboard(today)
    );

    const result = appointments.map((item) => new Appointment(item));
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in findAppointmentDashboard", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const pipelineFindAppointmentDashboard = (d1) => [
  {
    // Đầu tiên, lọc các document theo khoảng thời gian
    $match: {
      $or: [
        { status: { $in: ["in-progress", "confirmed", "pending"] } }, // hiện đơn hàng đang xử lý, đã được xác nhận
        { status: "completed", invoiceCreated: false }, // đơn hàng đã hoàn thành nhưng chưa thanh toán
        { status: { $in: ["missed", "canceled"] }, startActual: { $gte: d1 } }, // đơn hàng bị huỷ và bỏ lỡ
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
    $project: {
      day: { $dayOfMonth: "$startActual" },
      month: { $month: "$startActual" },
      year: { $year: "$startActual" },
      sortPriority: 1,
      appointment: "$$ROOT",
    },
  },
  {
    $group: {
      _id: { year: "$year", month: "$month", day: "$day" },
      appointments: { $push: "$appointment" },
    },
  },
  { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  {
    $project: {
      _id: 1,
      appointments: {
        $sortArray: {
          input: "$appointments",
          sortBy: { status: 1 }, // tùy chỉnh sắp xếp theo thứ tự ưu tiên trạng thái nếu cần
        },
      },
    },
  },
  {
    $unwind: {
      path: "$appointments",
    },
  },
  {
    $replaceRoot: {
      newRoot: "$appointments",
    },
  },
  {
    // Nếu không cần trường sortPriority trong kết quả cuối
    $project: {
      sortPriority: 0,
    },
  },
];
const createAppointmentOnSite = async (appointment, skipCond) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const start_timestamp = setStartTime(appointment.startTime);
    const start_time = new Date(start_timestamp);
    const total_duration = Number(appointment.total_duration);
    const end_timestamp = calEndtime(
      new Date(appointment.startTime).getTime(),
      total_duration
    );
    console.log(new Date(end_timestamp)); //log

    const end_time = new Date(setEndTime(end_timestamp));
    appointment.endTime = end_time;
    appointment.startActual = start_time;
    appointment.endActual = end_time;
    appointment.status = "in-progress";
    if (appointment?.items?.[0]) {
      appointment.items[0].status = "in-progress";
    }
    //Lấy ra những lịch hẹn ảnh hưởng đến khung giờ đặt lịch
    const existing_apps =
      await findAppointmentStatusNotCanceledCompletedInRangeDate(
        start_time,
        end_time
      );
    //Kiểm tra thời gian bắt đầu nếu 6 vị trí đang in-progress thì không cho đặt
    apps_inProgress = existing_apps.map((item) => item.status == "in-progress");
    if (apps_inProgress.length >= 6) {
      return {
        code: 500,
        message: "Thời gian bắt đầu đã đầy vị trí xử lý. Hãy lùi khung giờ lại",
        data: null,
      };
    }
    if (!skipCond || !validator.toBoolean(skipCond, true)) {
      const slot_booking = await groupSlotTimePoint(
        existing_apps,
        start_time.getTime(),
        end_time.getTime()
      );
      for (const [index, value] of slot_booking.entries()) {
        if (value < 6) {
          continue;
        }
        const time_full = setStartTime(
          calEndtime(start_time.getTime(), index * interval)
        );
        return {
          code: 400,
          message: `Đã đầy lịch hẹn tại khung giờ ${getStringClockToDate(
            time_full
          )}.Thời gian còn lại chỉ phù hợp cho dịch vụ từ dưới ${
            index * interval
          } giờ`,
          data: null,
        };
      }
    }
    const time_promotion = new Date();
    const items = appointment.items.map((item) => item.serviceId);
    // áp dụng loại khuyến mãi dịch vụ
    const promotion_result = [];
    const list_pro_service = await getProService(time_promotion, items);
    if (list_pro_service.length > 0) {
      appointment.items.forEach((item) => {
        const pro = list_pro_service.find(
          (pro) => pro.itemGiftId == item.serviceId
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
    //tạo thông tin khách hàng
    let customer = await findCustByPhone(appointment.customer.phone);
    if (!customer) {
      customerResult = await createCustomer(appointment.customer);
      if (customerResult.code == 200) {
        customer = customerResult.data;
      } else {
        return customerResult;
      }
    }
    appointment.customer = customer;
    // tạo object hoá đơn
    appointment.promotion = promotion_result;
    appointment.appointmentId = await generateAppointmentID({ session });
    const appointment_result = await Appointment.create([appointment], {
      session,
    });
    //await session.commitTransaction(); //log
    const data_response = await Appointment.findById(appointment_result[0]._id);
    return {
      code: 200,
      message: "Thành công",
      data: data_response,
    };
  } catch (error) {
    console.log("Error in saveAppointmetOnSite: ", error);
    await session.abortTransaction();
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
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  } finally {
    session.endSession();
  }
};
const createAppointmentOnSiteFuture = async (appointment, skipCond) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const start_timestamp = setStartTime(appointment.startTime);
    const start_time = new Date(start_timestamp);
    const total_duration = Number(appointment.total_duration);
    const end_timestamp = calEndtime(
      new Date(appointment.startTime).getTime(),
      total_duration
    );
    const end_time = new Date(setEndTime(end_timestamp));
    appointment.endTime = end_time;
    appointment.startActual = start_time;
    appointment.endActual = end_time;
    appointment.status = "pending";

    //Lấy ra những lịch hẹn ảnh hưởng đến khung giờ đặt lịch
    const existing_apps =
      await findAppointmentStatusNotCanceledCompletedInRangeDate(
        start_time,
        end_time
      );
    //Kiểm tra thời gian bắt đầu nếu 6 vị trí đang in-progress thì không cho đặt
    apps_inProgress = existing_apps.map((item) => item.status == "in-progress");
    console.log(apps_inProgress);

    if (apps_inProgress.every((item) => item == true)) {
      return {
        code: 500,
        message: "Thời gian bắt đầu đã đầy vị trí xử lý. Hãy lùi khung giờ lại",
        data: null,
      };
    }
    //Kiểm tra khung giờ đầy
    if (!skipCond || !validator.toBoolean(skipCond, true)) {
      const slot_booking = await groupSlotTimePoint(
        existing_apps,
        start_time.getTime(),
        end_time.getTime()
      );
      for (const [index, value] of slot_booking.entries()) {
        if (value < 6) {
          continue;
        }
        const time_full = setStartTime(
          calEndtime(start_time.getTime(), index * interval)
        );
        return {
          code: 400,
          message: `Đã đầy lịch hẹn tại khung giờ ${getStringClockToDate(
            time_full
          )}.Thời gian còn lại chỉ phù hợp cho dịch vụ từ dưới ${
            index * interval
          } giờ`,
          data: null,
        };
      }
    }
    const time_promotion = new Date();
    const items = appointment.items.map((item) => item.serviceId);
    // áp dụng loại khuyến mãi dịch vụ
    const promotion_result = [];
    const list_pro_service = await getProService(time_promotion, items);
    if (list_pro_service.length > 0) {
      appointment.items.forEach((item) => {
        const pro = list_pro_service.find(
          (pro) => pro.itemGiftId == item.serviceId
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
    //tạo thông tin khách hàng
    let customer = await findCustByPhone(appointment.customer.phone);
    if (!customer) {
      customerResult = await createCustomer(appointment.customer);
      if (customerResult.code == 200) {
        customer = customerResult.data;
      } else {
        return customerResult;
      }
    }
    appointment.customer = customer;
    // tạo object hoá đơn
    appointment.promotion = promotion_result;
    appointment.appointmentId = await generateAppointmentID({ session });
    const appointment_result = await Appointment.create([appointment], {
      session,
    });
    await session.commitTransaction();
    const data_response = await Appointment.findById(appointment_result[0]._id);
    return {
      code: 200,
      message: "Thành công",
      data: data_response,
    };
  } catch (error) {
    console.log("Error in saveAppointmetOnSite: ", error);
    await session.abortTransaction();
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
      message: "Đã xảy ra lỗi máy chủ",
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
const updateStatusInProgressAppointment = async (id, itemsPriority) => {
  try {
    //lấy lịch hẹn
    const doc = await getAppointmentById(id);
    const obj = doc ? doc.toObject() : null;
    if (!obj) {
      return status400("Không tìm thấy lịch hẹn");
    }
    //kiểm tra hiện tại có đang full vị trí xử lý không
    const now = new Date();
    const countInProgress = await Appointment.countDocuments({
      startActual: { $lt: now },
      endActual: { $gt: now },
      status: "in-progress",
    });
    if (countInProgress >= 6) {
      return status400("Đang đầy vị trí xử lý");
    }
    if (!Array.isArray(itemsPriority)) {
      return status400("Bad request");
    }
    const ids = itemsPriority.map((item) => item.serviceId);
    const checkMatchItems = obj.items.every((item) =>
      ids.includes(item.serviceId)
    );
    if (!checkMatchItems) {
      return status400("Bad request");
    }
    const itemsSort = [];
    for (let item of itemsPriority) {
      const service = obj.items.find((ele) => ele.serviceId == item.serviceId);
      itemsSort.push(service);
    }
    const result = await Appointment.findOneAndUpdate(
      { _id: id },
      { $set: { status: "in-progress", items: itemsSort } },
      { new: true }
    );
    return { code: 200, message: "Thành công", data: result };
  } catch (error) {
    console.log("Error in function updateStatusInProgressAppointment", error);
    return status500;
  }
};
const updateStatusCompletedAppointment = async (id) => {
  try {
    //lấy lịch hẹn
    const doc = await getAppointmentById(id);
    const obj = doc ? doc.toObject() : null;
    if (!obj) {
      return status400("Không tìm thấy lịch hẹn");
    }
    //kiểm tra các dịch vụ lịch hẹn đã hoàn tất hết chưa
    const checkCompleted = obj.items.some((item) => item.status != "completed");
    if (checkCompleted) {
      return status400("Còn dịch vụ chưa hoàn thành trong đơn hàng");
    } else {
      const result = await Appointment.findOneAndUpdate(
        { _id: id },
        { $set: { status: "completed" } },
        { new: true }
      );
      return { code: 200, message: "Thành công", data: result };
    }
  } catch (error) {
    console.log("Error in function updateStatusInProgressAppointment", error);
    return status500;
  }
};
const updateStatusCancelAppointment = async (id) => {
  try {
    //lấy lịch hẹn
    const doc = await getAppointmentById(id);
    const obj = doc ? doc.toObject() : null;
    if (!obj) {
      return status400("Không tìm thấy lịch hẹn");
    }
    //Chỉ được phép huỷ lịch hẹn đang pending
    if (obj.status != "pending") {
      return status400("Chỉ được huỷ lịch hẹn đang chờ xử lý");
    } else {
      const result = await Appointment.findOneAndUpdate(
        { _id: id },
        { $set: { status: "canceled" } },
        { new: true }
      );
      return { code: 200, message: "Thành công", data: result };
    }
  } catch (error) {
    console.log("Error in function updateStatusInProgressAppointment", error);
    return status500;
  }
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
        new Date(setStartTime(ele.startActual)).getTime() <= time_point &&
        new Date(ele.endActual).getTime() > time_point
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
    if (duration - count < interval) {
      endTime += (duration - count) * 60 * 60 * 1000;
    } else {
      const temp = new Date(endTime);
      if (temp.getHours() + temp.getMinutes() / 60 > end_work - interval) {
        endTime += (24 - (end_work - start_work) + interval) * 60 * 60 * 1000;
      } else {
        endTime += interval * 60 * 60 * 1000;
      }
    }
    count += interval;
  }
  return endTime;
};
const setStartTime = (startTime) => {
  if (60 % (interval * 60) != 0) {
    throw new Error("Thiết lập bước không hợp lệ, interval phải là ước của 60");
  }
  const date = new Date(startTime);
  const part = Math.floor(60 / (interval * 60));
  for (let i = 0; i < part; i++) {
    if (
      i * interval * 60 <= date.getMinutes() &&
      date.getMinutes() < (i + 1) * interval * 60
    ) {
      date.setMinutes(i * interval * 60, 0, 0);
      return date.getTime();
    }
  }
};
const setEndTime = (endTime) => {
  if (60 % (interval * 60) != 0) {
    throw new Error("Thiết lập bước không hợp lệ, interval phải là ước của 60");
  }
  const date = new Date(endTime);
  const part = Math.floor(60 / (interval * 60));
  if (date.getMinutes() == 0) {
    return date.getTime();
  }
  if (
    (part - 1) * interval * 60 < date.getMinutes() &&
    date.getMinutes() <= part * interval * 60
  ) {
    const h = date.getHours() + 1;
    date.setHours(h, 0, 0, 0);
    return date.getTime();
  }
  for (let i = 0; i < part; i++) {
    if (
      i * interval * 60 < date.getMinutes() &&
      date.getMinutes() <= (i + 1) * interval * 60
    ) {
      date.setMinutes((i + 1) * interval * 60, 0, 0);
      return date.getTime();
    }
  }
};
const getTimePointAvailableBooking_New = async (date, duration) => {
  const date_booking = new Date(date);
  date_booking.setHours(0, 0, 0, 0);
  const t1 = date_booking.getTime() + start_work * 60 * 60 * 1000;
  const start = date_booking.getTime() + end_work * 60 * 60 * 1000;
  const t2 = calEndtime(start, duration - interval);
  const booking_exist =
    await findAppointmentStatusNotCanceledCompletedInRangeDate(
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

  const booking_exist =
    await findAppointmentStatusNotCanceledCompletedInRangeDate(
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

const updateAppointmentCreatedInvoice = async (id, session) => {
  const result = await Appointment.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        invoiceCreated: true,
      },
    },
    { new: true, ...session }
  );
  if (result) {
    connection.sendMessageAllStaff(messageType.created_invoice_app, result);
  }
  return result;
};
const findAllAppointment = async (page, limit, field, word) => {
  try {
    const filter = {};
    if (field && word) {
      switch (field) {
        case "invoiceCreated":
          filter[field] = validator.toBoolean(word, true);
          break;
        default:
          filter[field] = RegExp(word, "iu");
          break;
      }
    }
    const totalCount = await Appointment.countDocuments(filter);
    const result = await Appointment.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPage = Math.ceil(totalCount / limit);
    return {
      code: 200,
      message: "Thành công",
      totalCount,
      totalPage,
      data: result,
    };
  } catch (error) {
    console.log("Error in get all cateogry", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const getAppointmentById = async (id) => await Appointment.findOne({ _id: id });
const getAppointmentLeanById = async (id) =>
  await Appointment.findOne({ _id: id }).lean();
const getAppointmentByAppointmentId = async (appointmentId) =>
  await Appointment.findOne({ appointmentId: appointmentId }).lean();
const getAppointmentByServiceId = async (serviceId) =>
  await Appointment.findOne({ "items.serviceId": serviceId }).lean();
const updateStatusCompletedServiceAppointment = async (
  appointmentId,
  serviceId
) => {
  try {
    const obj = await Appointment.findOne({
      _id: appointmentId,
      "items.serviceId": serviceId,
    });
    if (!obj) {
      return status400("Không tìm thấy lịch hẹn");
    }
    const items = obj.items;
    const index = items.findIndex((item) => item.serviceId == serviceId);
    if (index < items.length - 1) {
      items[index].status = "completed";
      items[index + 1].status = "in-progress";
    } else {
      //Xử lý khi cập nhật dịch vụ cuối
      items[index].status = "completed";
    }
    const result = await Appointment.findOneAndUpdate(
      { _id: appointmentId },
      { $set: { items: items } },
      { new: true }
    );
    return status200(result);
  } catch (error) {
    console.log("Error in updateStatusCompletedServiceAppointment", error);
    return status500;
  }
};
const status500 = { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
const status400 = (mess) => ({ code: 400, message: mess, data: null });
const status200 = (data) => ({ code: 200, message: "Thành công", data: data });
module.exports = {
  createAppointmentOnSite,
  createAppointmentOnSiteFuture,
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
  getAppointmentById,
  getAppointmentLeanById,
  updateAppointmentCreatedInvoice,
  getAppointmentByServiceId,
  findAppointmentDashboard,
  findAllAppointment,
  updateStatusCompletedServiceAppointment,
  getAppointmentByAppointmentId,
  updateStatusInProgressAppointment,
  updateStatusCompletedAppointment,
  updateStatusCancelAppointment,
};
