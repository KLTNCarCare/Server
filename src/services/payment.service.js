const { format } = require("express/lib/response");
const { getAppointmentById } = require("./appointment.service");
const crypto = require("crypto");
const qs = require("querystring");
const createRequestPayment = async (id) => {
  const obj = await getAppointmentById(id, vnp_IpAddr);
  if (!obj) {
    return { code: 400, message: "Không tìm thấy đơn hàng", data: null };
  }
  console.log(obj); //log
  //tạo thông tin thanh toán
  const params = {};
  params.vnp_Version = "2.1.0";
  params.vnp_Command = "pay";
  params.vnp_TmnCode = "MTYG9I68";
  params.vnp_Locale = "vn";
  params.vnp_CurrCode = "VND";
  params.vnp_BankCode = "VNPAYQR";
  params.vnp_Amount = obj.final_total * 100;
  params.vnp_CreateDate = moment(new Date()).format("YYYYMMDDHHmmss");
  params.vnp_IpAddr = vnp_IpAddr;
  params.vnp_OrderInfo = "Thanh toan don hang " + obj.appointmentId;
  params.vnp_OrderType = "Phu kien o to";
  params.vnp_ReturnUrl = "http://localhost:3000/order/vnpay_return";
  params.vnp_ExpireDate = moment(new Date(Date.now + 10 * 60 * 1000)).format(
    "YYYYMMDDHHmmss"
  );
  params.vnp_TxnRef = obj.appointmentId;
  const signData = qs.stringify(params, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.vnp_HashSecret);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  params.vnp_SecureHash;
};
