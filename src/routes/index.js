const router = require("express").Router();
const accountRouter = require("./account.route");
const authRouter = require("./auth.route");
const employeeRouter = require("./employee.route");
const delayMiddleware = require("../middlewares/delay.middleware");
const auth = require("../middlewares/auth.middleware");
const priceCatalogRouter = require("./price_catalog.route");
const promotionRouter = require("./promotion.route");
const categoryRouter = require("./category.route");
const serviceRouter = require("./service.route");
const productRouter = require("./product.route");
const appointmentRouter = require("./appointment.route");
const invoiceRouter = require("./invoice.route");
const customerRouter = require("./customer.route");
const paymentRouter = require("./payment.route");
const staffRouter = require("./staff.route");
const otpRouter = require("./otp.route");
const statisticRouter = require("./statistic.route");
//delayMiddleware return response
router.all("*", delayMiddleware);
router.use("/account", accountRouter);
router.use("/auth", authRouter);
router.use("/heart-beat", (req, res) => {
  res.status(200).json(req.body);
});
router.use("/employee", employeeRouter);
router.use("/price-catalog", priceCatalogRouter);
router.use("/promotion", promotionRouter);
router.use("/category", categoryRouter);
router.use("/service", serviceRouter);
router.use("/product", productRouter);
router.use("/appointment", appointmentRouter);
router.use("/invoice", invoiceRouter);
router.use("/customer", customerRouter);
router.use("/payment", paymentRouter);
router.use("/staff", staffRouter);
router.use("/otp", otpRouter);
router.use("/statistic", statisticRouter);
module.exports = router;
