const {
  statisticsByCustomerService,
  statisticsByCustomerExportCSVService,
  statisticsByStaffService,
  statisticsByStaffExportCSVService,
  statisticsServiceRefundService,
  statisticsServiceRefundExportCSVService,
  statisticsPromotionResultService,
  statisticsPromotionResultExportCSVService,
} = require("../services/statistical.service");

const statisticsByCustomer = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await statisticsByCustomerService(
    fromDate,
    toDate,
    page,
    limit
  );
  return res.status(result.code).json(result);
};
const statisticsByCustomerExportCSV = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const result = await statisticsByCustomerExportCSVService(fromDate, toDate);
  return res.status(result.code).json(result);
};
const statisticsByStaff = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await statisticsByStaffService(fromDate, toDate, page, limit);
  return res.status(result.code).json(result);
};
const statisticsByStaffExportCSV = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const result = await statisticsByStaffExportCSVService(fromDate, toDate);
  return res.status(result.code).json(result);
};
const statisticsServiceRefund = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await statisticsServiceRefundService(
    fromDate,
    toDate,
    page,
    limit
  );
  return res.status(result.code).json(result);
};
const statisticsServiceRefundExportCSV = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const result = await statisticsServiceRefundExportCSVService(
    fromDate,
    toDate
  );
  return res.status(result.code).json(result);
};
const statisticsPromotionResult = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await statisticsPromotionResultService(
    fromDate,
    toDate,
    page,
    limit
  );
  return res.status(result.code).json(result);
};
const statisticsPromotionResultExportCSV = async (req, res) => {
  const fromDate = Number(req.query.fromDate);
  const toDate = Number(req.query.toDate);
  const result = await statisticsPromotionResultExportCSVService(
    fromDate,
    toDate
  );
  return res.status(result.code).json(result);
};
module.exports = {
  statisticsByCustomer,
  statisticsByCustomerExportCSV,
  statisticsByStaff,
  statisticsByStaffExportCSV,
  statisticsServiceRefund,
  statisticsServiceRefundExportCSV,
  statisticsPromotionResult,
  statisticsPromotionResultExportCSV,
};
