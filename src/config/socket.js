const express = require("express");
const http = require("http");
const sockjs = require("sockjs");
const connect = require("../services/sockjs_manager");
const app = express();
const server = http.createServer(app);

//Tạo sockJs server
const sockjs_server = sockjs.createServer();
sockjs_server.installHandlers(server, { prefix: "/sockjs/staff" });

// Xử lý kết nối SockJS
sockjs_server.on("connection", (conn) => {
  conn.write("Kết nối với server sockjs thành công!");
  console.log({
    conn,
  });

  // lưu id client kết nối
  connect.addConnection(conn.id, conn);

  // data client gửi về
  conn.on("data", (message) => {
    console.log("Received:", message);
  });

  //client đóng kết nối
  conn.on("close", () => {
    connect.removeConnection(conn.id);
    console.log("Client disconnected");
  });

  //Ngắt kết nối client
  // conn.close(1000, "Server đã ngắt kết nối với bạn");
});

module.exports = { app, server };
