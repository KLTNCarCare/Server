const validator = require("validator");
const {
  countAppointmentAtTime,
  createAppointment,
  findAppointmentInRangeDate,
} = require("../services/appointment.service");

//get time available in day
const start_work = 7; // 7:00 A.M
const end_work = 17; // 5:00 P.M
const interval = 0.5; // 0.5h
const max_slot = 6;
//in put YYYY-MM-dd, duration(number)
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
    const dateBook = new Date(req.body.dateBook);
    dateBook.setHours(0, 0, 0, 0);
    const duration = Number(req.body.duration);
    const d1 = new Date(dateBook);
    const d2 = new Date(dateBook);
    d2.setDate(dateBook.getDate() + 1);
    d2.setHours(23, 59, 59, 999);
    console.log(dateBook, d1, d2);
    // danh sách lịch đặt của ngày yêu cầu và ngày tiếp theo
    const existing_apps = await findAppointmentInRangeDate(d1, d2);
    const booked_slots = [];
    //lấy danh sách số lượng chỗ đặt của từng mốc thời gian của ngày yêu cầu
    for (let i = start_work; i < end_work; i += interval) {
      const current_time = dateBook.getTime() + i * 60 * 60 * 1000;
      const slot = countAppointment(existing_apps, current_time);
      booked_slots.push(slot);
    }
    const next_date = new Date(dateBook);
    next_date.setDate(dateBook.getDate() + 1);
    //lấy danh sách số lượng chỗ đặt của từng mốc thời gian của ngày kế tiếp ngày  yêu cầu
    for (let i = start_work; i < start_work + duration; i += interval) {
      const current_time = next_date.getTime() + i * 60 * 60 * 1000;
      const slot = countAppointment(existing_apps, current_time);
      booked_slots.push(slot);
    }
    //lấy danh sách những mốc thời gian cho phép đặt
    const slots_available = [];
    for (
      let i = start_work;
      i < end_work + duration - interval;
      i += interval
    ) {
      const start = i * 2 - start_work * 2;
      const end = (i + duration) * 2 - start_work * 2;
      const isAvailable = booked_slots
        .slice(start, end)
        .every((num) => num < max_slot);
      if (isAvailable) {
        slots_available.push(i);
      }
    }
    return res
      .status(200)
      .json({ existing_apps, booked_slots, slots_available });
  } catch (error) {
    console.log("Error in getTimeAvailable:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const countAppointment = (array, value) => {
  return array.filter(
    (ele) => new Date(ele.startTime) <= value && new Date(ele.endTime) >= value
  ).length;
};

//create appointment
const saveAppointment = async (req, res) => {
  try {
    const result = await createAppointment(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in saveAppointmet: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//update time booking
//
module.exports = { saveAppointment, getTimeAvailable };
