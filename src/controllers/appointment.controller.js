const validator = require("validator");
const {
  createAppointment,
  pushServiceToAppointment,
  pullServiceToAppointment,
  updateStatusAppoinment,
  getAllSlotInDate,
  getTimePointAvailableBooking_New,
  createAppointmentOnSite,
  findAppointmentDashboard,
  findAllAppointment,
  updateStatusCompletedServiceAppointment,
  createAppointmentOnSiteFuture,
  updateStatusInProgressAppointment,
  updateStatusCompletedAppointment,
  updateStatusCancelAppointment,
  updateStatusInProgressAppointmentNew,
  createInfoAppointment,
} = require("../services/appointment.service");
const connection = require("../services/sockjs_manager");
const { messageType } = require("../utils/constants");
const Appointment = require("../models/appointment.model");
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
      return res.status(400).json({ message: "Bad request" });
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
    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const saveAppointment = async (req, res) => {
  const data = req.body;
  const result = await createAppointment(data);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.save_app, result.data);
  }
  return res.status(result.code).json({
    message: result.message,
    data: result.data,
  });
};
const saveAppointmentOnSite = async (req, res) => {
  const data = req.body;
  const skipCond = req.query.skipCond;
  const result = await createAppointmentOnSite(data, skipCond);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.in_progress_app, result.data);
  }
  return res.status(result.code).json(result);
};
const saveAppointmentOnSiteFuture = async (req, res) => {
  const data = req.body;
  const skipCond = req.query.skipCond;
  const result = await createAppointmentOnSiteFuture(data, skipCond);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.save_app, result.data);
  }
  return res.status(result.code).json(result);
};
// add service
const addServiceToAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const service = req.body;
    const result = await pushServiceToAppointment(id, service);
    if (!result) {
      return res.status(500).json({ message: "Thêm thất bại" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in addServiceToAppointment", error);

    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
// chỉ được xoá service có status là pending
const deleteServiceToAppointment = async (req, res) => {
  try {
    const { id, serviceId } = req.params;
    const result = await pullServiceToAppointment(id, serviceId);

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Xoá thất bại! Chỉ có thể xoá khi lịch hẹn đang chờ xác nhận",
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in deleteServiceToAppointment", error);
    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
// cập nhật trạng thái là in-progress khi xe đang được xử lý
const inProgressAppointment = async (req, res) => {
  const id = req.params.id;
  const items = req.body.items;
  const result = await updateStatusInProgressAppointmentNew(id);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.in_progress_app, result.data);
  }
  return res.status(result.code).json(result);
};
//cập nhật trạng thái là completed khi xe đã xử lý xong
const completeAppointment = async (req, res) => {
  const id = req.params.id;
  const result = await updateStatusCompletedAppointment(id);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.complete_app, result.data);
  }
  return res.status(result.code).json(result);
};
const cancelAppointment = async (req, res) => {
  const id = req.params.id;
  const result = await updateStatusCancelAppointment(id);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.cancel_app, result.data);
  }
  return res.status(result.code).json(result);
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
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const getAppointmentInDay = async (req, res) => {
  const time = Number(req.query.date) || Date.now();
  const result = await findAppointmentDashboard(time);
  return res.status(result.code).json(result.data);
};
const getAllAppointment = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await findAllAppointment(page, limit, field, word);
  return res.status(result.code).json(result);
};
const updateProccessAppointment = async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const serviceId = req.params.serviceId;
  const result = await updateStatusCompletedServiceAppointment(
    appointmentId,
    serviceId
  );
  if (result.code == 200) {
    const app = new Appointment(result.data);
    if (result.data.status == "completed") {
      connection.sendMessageAllStaff(messageType.complete_app, app);
    } else {
      connection.sendMessageAllStaff(messageType.update_process_app, app);
    }
  }
  return res.status(result.code).json(result);
};
const getInfoAppointment = async (req, res) => {
  const data = req.body;
  const result = await createInfoAppointment(data);
  return res.status(result.code).json(result);
};
module.exports = {
  saveAppointment,
  saveAppointmentOnSite,
  saveAppointmentOnSiteFuture,
  getTimeAvailable,
  deleteServiceToAppointment,
  addServiceToAppointment,
  inProgressAppointment,
  completeAppointment,
  cancelAppointment,
  getAllSlotInDay,
  getAppointmentInDay,
  getAllAppointment,
  updateProccessAppointment,
  getInfoAppointment,
};
