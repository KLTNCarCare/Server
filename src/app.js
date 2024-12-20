const express = require("express");
const connection = require("./config/database");
const router = require("./routes");
const cors = require("cors");
const {
  cronJobExpiresAppointment,
  cronJobResetIdInvoice,
  cronRefreshPriceCatalog,
  cronRefreshPromotionLine,
} = require("./services/cron_job.service");
const { app, server } = require("./config/socket");
const startServer = async (port) => {
  //connect database
  await connection();

  // option cors
  const corsOptions = {
    origin: ["http://localhost:3000", "https://carcarewweb.vercel.app"], // Thay thế bằng nguồn gốc của bạn
    credentials: true, // Cho phép gửi cookie và các thông tin xác thực khác
  };

  //middleware cors
  app.use(cors(corsOptions));

  //config request body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  //middleware router
  app.use("/v1/api", router);

  //middleware error 404
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
  });

  // Middleware xử lý lỗi toàn cục
  app.use((err, req, res, next) => {
    console.error(err.stack); // Ghi lỗi vào console (hoặc log lỗi vào file)

    // Nếu môi trường là 'development', gửi thông tin lỗi chi tiết
    if (app.get("env") === "development") {
      return res.status(err.status || 500).json({
        error: {
          message: err.message,
          stack: err.stack,
        },
      });
    }

    // Nếu không phải môi trường 'development', chỉ gửi thông báo lỗi chung
    return res.status(err.status || 500).json({
      error: {
        message: "Đã xảy ra lỗi máy chủ",
      },
    });
  });
  cronJobResetIdInvoice.start();
  cronRefreshPriceCatalog.start();
  cronRefreshPromotionLine.start();
  //start server
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
};
module.exports = startServer;
