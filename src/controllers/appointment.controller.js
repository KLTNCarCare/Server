const validator = require("validator");
const {
  countAppointmentAtTime,
  createAppointment,
  findAppointmentInRangeDate,
  pushServiceToAppointment,
  pullServiceToAppointment,
  updateStatusAppoinment,
  getTimePointAvailableBooking,
  groupSlotTimePoint,
  getAllSlotInDate,
  getAppointmentInDate,
} = require("../services/appointment.service");

//get time available in day
const start_work = 7; // 7:00 A.M
const end_work = 17; // 5:00 P.M
const interval = 0.5; // 0.5h
const max_slot = 6;
//input YYYY-MM-dd, duration(number)
const getTimeAvailable = async (req, res) => {
  try {
    const data = req.body;
    // kiểm tra đầu vào không null, ngày đặt phải là timestamp hoặc ISODate 8601, duration phải là số
    if (
      !data.dateBook ||
      !data.duration ||
      !validator.isNumeric(data.duration)
    ) {
      return res.status(400).json({ message: "Bad request" });
    }
    if (!validator.isISO8601(data.dateBook)) {
      if (!validator.isInt(data.dateBook)) {
        return res.status(400).json({ message: "Bad request" });
      }
    }
    const result = await getTimePointAvailableBooking(
      data.dateBook,
      Number(data.duration)
    );
    return res.status(200).json({
      date_book: data.dateBook,
      booking_available: result,
    });
  } catch (error) {
    console.log("Error in getTimeAvailable:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const countAppointment = (array, value) => {
  return array.filter(
    (ele) => new Date(ele.startTime) <= value && new Date(ele.endTime) > value
  ).length;
};

//create appointment
const saveAppointment = async (req, res) => {
  try {
    //kiểm tra slot của khung giờ đặt
    const start_time = new Date(req.body.startTime);
    const end_time = new Date(req.body.endTime);
    const existing_apps = await findAppointmentInRangeDate(
      start_time,
      end_time
    );
    const slot_booking = await groupSlotTimePoint(
      existing_apps,
      start_time.getTime(),
      end_time.getTime()
    );
    // let isAvailable = true;
    // for (
    //   let i = start_time.getTime();
    //   i < end_time.getTime();
    //   i += interval * 60 * 60 * 1000
    // ) {
    //   const current_time = new Date(i);
    //   if (
    //     current_time.getHours() >= end_work ||
    //     current_time.getHours() < start_work
    //   ) {
    //     continue;
    //   }
    //   const slot = existing_apps.filter(
    //     (ele) =>
    //       new Date(ele.startTime) <= current_time &&
    //       new Date(ele.endTime) > current_time
    //   ).length;

    //   if (slot >= max_slot) {
    //     isAvailable = false;
    //     break;
    //   }
    // }
    if (slot_booking.some((num) => num >= Number(process.env.LIMIT_SLOT))) {
      return res.status(400).json({
        message: "Khung giờ chọn đã đầy.Vui lòng chọn khung giờ khác",
      });
    }
    const result = await createAppointment(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in saveAppointmet: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// add service
const addServiceToAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const service = req.body;
    const result = await pushServiceToAppointment(id, service);
    if (!result) {
      return res.status(500).json({ message: "add service failure" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in addServiceToAppointment", error);

    res.status(500).json({ message: "Internal server error" });
  }
};
// chỉ được xoá service có status là pending
const deleteServiceToAppointment = async (req, res) => {
  try {
    const { id, serviceId } = req.params;
    const result = await pullServiceToAppointment(id, serviceId);

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Delete failure!Only can delete service is pending!",
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in deleteServiceToAppointment", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// cập nhật trạng thái là in-progress khi xe đang được xử lý
const inProgressAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await updateStatusAppoinment(id, "in-progress");
    if (!result) {
      return res.status(400).json({ message: "Update status failure" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in inProgressAppointment", error);

    return res.status(500).json({ message: "Internal server error" });
  }
};
//cập nhật trạng thái là confirmed khi tiếp nhận xe của khách
const confirmAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await updateStatusAppoinment(id, "confirmed");
    if (!result) {
      return res.status(400).json({ message: "Update status failure" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in inProgressAppointment", error);

    return res.status(500).json({ message: "Internal server error" });
  }
};
//cập nhật trạng thái là completed khi xe đã xử lý xong
const completeAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await updateStatusAppoinment(id, "completed");
    if (!result) {
      return res.status(400).json({ message: "Update status failure" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in inProgressAppointment", error);

    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAllSlotInDay = async (req, res) => {
  try {
    const day = req.body.date;
    if (!day) return res.status(400).json({ message: "Bad request" });
    if (!validator.isISO8601(day))
      if (!validator.isInt(day))
        return res.status(400).json({ message: "Bad request" });
    const result = await getAllSlotInDate(day);
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in getAllSlotInDay", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAppointmentInDay = async (req, res) => {
  try {
    const day = req.body.date;
    if (!day) return res.status(400).json({ message: "Bad request" });
    if (!validator.isISO8601(day))
      if (!validator.isInt(day))
        return res.status(400).json({ message: "Bad request" });
    const result = await getAppointmentInDate(day);
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in getAllSlotInDay", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  saveAppointment,
  getTimeAvailable,
  deleteServiceToAppointment,
  addServiceToAppointment,
  inProgressAppointment,
  confirmAppointment,
  completeAppointment,
  getAllSlotInDay,
  getAppointmentInDay,
};
