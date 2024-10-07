const { default: mongoose } = require("mongoose");

const createInvoiceFromAppointmentId = async (appId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const app = await Appointment.findById({ _id: id });
    // Không tìm thấy appointment
    if (!app) {
      return {
        code: 400,
        message: "Dont find appointment with _id " + appId,
        data: null,
      };
    }
  } catch (error) {
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
