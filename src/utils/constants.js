const messageType = {
  save_app: "SAVE-APPOINTMENT",
  confirm_app: "CONFIRMED-APPOINTMENT",
  pending_app: "PENDING-APPOINTMENT",
  in_progress_app: "IN-PROGRESS-APPOINTMENT",
  complete_app: "COMPLETED-APPOINTMENT",
  cancel_app: "CANCELED-APPOINTMENT",
  missed_app: "MISSED-APPOINTMENT",
  created_invoice_app: "CREATED-INVOICE-APPPOINTMENT",
  pay_invoice: "PAID-INVOICE",
  update_process_app: "PROCESS-APPOINTMENT",
  save_invoice_refund: "SAVE-INVOICE-REFUND",
  save_invoice: "SAVE-INVOICE",
};
module.exports = { messageType };
