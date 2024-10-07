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
  getTimePointAvailableBooking_New,
  calEndtime,
} = require("../services/appointment.service");

//get time available in day
const start_work = 7; // 7:00 A.M
const end_work = 17; // 5:00 P.M
const interval = 0.5; // 0.5h
const max_slot = 6;
//input YYYY-MM-dd, duration(number)
const getTimeAvailable = async (req, res) => {
  try {
    const day_timestamp = req.query.dateBook;
    const duration = req.query.duration;
    // kiểm tra đầu vào không null, ngày đặt phải là timestamp hoặc ISODate 8601, duration phải là số
    if (
      !day_timestamp ||
      !duration ||
      !validator.isInt(day_timestamp) ||
      !validator.isNumeric(duration)
    ) {
      return res.status(400).json({ message: "Bad requestt" });
    }
    const result = await getTimePointAvailableBooking_New(
      Number(day_timestamp),
      Number(duration)
    );
    return res.status(200).json({
      date_book: new Date(Number(day_timestamp)),
      booking_available: result,
    });
  } catch (error) {
    console.log("Error in getTimeAvailable:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const saveAppointment = async (req, res) => {
  const data = req.body;
  const result = await createAppointment(data);
  return res.status(result.code).json({
    message: result.message,
    data: result.data,
  });
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
    const day_timestamp = req.query.date;
    if (!day_timestamp || !validator.isInt(day_timestamp))
      return res.status(400).json({ message: "Bad request" });
    const result = await getAllSlotInDate(Number(day_timestamp));
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in getAllSlotInDay", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAppointmentInDay = async (req, res) => {
  try {
    const day_timestamp = req.query.date;
    if (!day_timestamp || !validator.isInt(day_timestamp))
      return res.status(400).json({ message: "Bad request" });
    const result = await getAppointmentInDate(Number(day_timestamp));
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
