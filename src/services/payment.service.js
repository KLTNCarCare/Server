const { format } = require("express/lib/response");
const {
  getAppointmentById,
  updateAppointmentCreatedInvoice,
  getAppointmentByAppointmentId,
} = require("./appointment.service");
const crypto = require("crypto");
const moment = require("moment");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { default: mongoose } = require("mongoose");
const {
  createInvoiceFromAppointmentId,
  createInvoiceByAppointmentId,
} = require("./invoice.service");
const { sendMessageAllStaff } = require("./sockjs_manager");
const { messageType } = require("../utils/constants");
const createPaymentVNPayGate = async (id, vnp_IpAddr) => {
  try {
    const obj = await getAppointmentById(id);
    if (!obj) {
      return { code: 400, message: "Không tìm thấy đơn hàng", data: null };
    }
    if (obj.invoiceCreated) {
      return { code: 400, message: "Đơn hàng đã có hoá đơn", data: null };
    }
    //tạo thông tin thanh toán
    let vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let params = {};
    //thong tin khach
    params.vnp_Bill_Mobile = obj.customer.phone;
    //
    params.vnp_Version = "2.1.0";
    params.vnp_Command = "pay";
    params.vnp_TmnCode = "MTYG9I68"; //hard
    params.vnp_Amount = obj.final_total * 100;
    // params.vnp_BankCode ;
    params.vnp_CreateDate = Number(moment(new Date()).format("YYYYMMDDHHmmss"));
    params.vnp_CurrCode = "VND";
    params.vnp_IpAddr = vnp_IpAddr;
    params.vnp_Locale = "vn";
    params.vnp_OrderInfo = "Thanh toan don hang " + obj.appointmentId;
    params.vnp_OrderType = "topup";
    params.vnp_ReturnUrl = "http://localhost:3000/order/vnpay_return";
    params.vnp_ExpireDate = Number(
      moment(new Date(Date.now() + 10 * 60 * 1000)).format("YYYYMMDDHHmmss")
    );
    params.vnp_TxnRef = obj.appointmentId;
    console.log(params);

    params = sortObjectKeys(params);
    const signData = jsonToQueryString(params);
    console.log("signdata= ", signData);

    const hmac = crypto.createHmac("sha512", process.env.vnp_HashSecret);
    const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    params.vnp_SecureHash = signed;
    vnp_Url += "?" + jsonToQueryString(params);
    console.log(signData); //log
    return {
      code: 200,
      message: "Thành công",
      data: {
        redirectUrl: vnp_Url,
      },
    };
  } catch (error) {
    console.log("Error in createRequestPayment", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};

function sortObjectKeys(inputObject) {
  // Tạo mảng chứa các khóa của object và sắp xếp theo thứ tự tăng dần
  const sortedKeys = Object.keys(inputObject).sort();
  // Tạo một object mới chứa các cặp khóa-giá trị đã sắp xếp
  const sortedObject = {};
  sortedKeys.forEach((key) => {
    sortedObject[key] = inputObject[key];
  });

  return sortedObject;
}
function jsonToQueryString(jsonObject) {
  // Sử dụng URLSearchParams để chuyển đối tượng JSON thành query string
  return new URLSearchParams(jsonObject).toString();
}
const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  pay_endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
};
const createPaymentZaloPay = async (id) => {
  try {
    //xử lý thông tin hoá đơn
    const obj = await getAppointmentById(id);
    if (!obj) {
      return { code: 400, message: "Không tìm thấy đơn hàng", data: null };
    }
    if (obj.invoiceCreated) {
      return { code: 400, message: "Đơn hàng đã có hoá đơn", data: null };
    }
    const embed_data = { redirecturl: `${process.env.HOST_WEB}/invoice` };
    const app_trans_id =
      moment().format("YYMMDDmmss") + "_" + obj.appointmentId;
    const order = {
      app_id: config.app_id,
      app_trans_id: app_trans_id, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
      app_user: "AK AUTO",
      app_time: Date.now(),
      expire_duration_seconds: 900, // miliseconds
      item: JSON.stringify(obj.items),
      embed_data: JSON.stringify(embed_data),
      amount: obj.final_total,
      description: `AK Auto - Thanh toán đơn hàng:${app_trans_id}`,
      callback_url:
        "https://8eb1-171-252-155-255.ngrok-free.app/v1/api/payment/callback",
      // bank_code: "zalopayapp",
    };
    const data =
      config.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
    order.expire_duration_seconds = 900;
    const result = await axios.post(config.pay_endpoint, null, {
      params: order,
    });
    return {
      code: 200,
      message: "Thành công",
      data: { order_url: result.data.order_url },
    };
  } catch (error) {
    console.log("Error in createRequestPayment", error);
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const callbackZaloPay = async (data) => {
  try {
    const dataStr = data.data;
    const reqMac = data.mac;
    const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    if (reqMac != mac) {
      console.log("mac khong khop");

      // return {return_code:-1,
      //   return_message:"mac not equal"
      // }
    } else {
      let dataJson = JSON.parse(dataStr, config.key2);
      const orderId = dataJson.app_trans_id.slice(11);
      console.log(orderId);
      const result = await createInvoiceByAppointmentId(orderId, "transfer");
      if (result.code == 200) {
        sendMessageAllStaff(messageType.save_invoice, result);
        return {
          return_code: 1,
          return_message: "Success",
        };
      } else {
        return {
          return_code: 0,
          return_message: "Success",
        };
      }
    }
  } catch (error) {
    console.log("Error in callbackZaloPay", error);
    await session.abortTransaction();
    return {
      return_code: 0,
      return_message: "Internal server merchant error",
    };
  }
};
module.exports = {
  createPaymentVNPayGate,
  createPaymentZaloPay,
  callbackZaloPay,
};