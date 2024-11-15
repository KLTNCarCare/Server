const {
  statisticsByCustomerService,
  statisticsByCustomerExportCSVService,
  statisticsByStaffService,
  statisticsByStaffExportCSVService,
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
module.exports = {
  statisticsByCustomer,
  statisticsByCustomerExportCSV,
  statisticsByStaff,
  statisticsByStaffExportCSV,
};
