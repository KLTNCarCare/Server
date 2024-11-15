const { Invoice } = require("../models/invoice.model");
const InvoiceRefund = require("../models/invoice_refund.model");
const Promotion = require("../models/promotion.model");
const statisticsByCustomerService = async (fromDate, toDate, page, limit) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);

    const count = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $group: {
          _id: "$customer.custId",
        },
      },
      { $count: "totalCount" },
    ]);
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $set: {
          items: {
            $map: {
              input: "$items",
              as: "service",
              in: {
                serviceId: "$$service.serviceId",
                serviceName: "$$service.serviceName",
                price: "$$service.price",
                discount: "$$service.discount",
                amount: {
                  $subtract: [
                    "$$service.price",
                    {
                      $multiply: [
                        "$$service.price",
                        { $divide: ["$$service.discount", 100] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          sub_total: { $sum: "$items.amount" },
          discount_bill: {
            $min: [
              "$discount.value_max",
              { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
            ],
          },
          final_total: {
            $subtract: [
              { $sum: "$items.amount" },
              {
                $min: [
                  "$discount.value_max",
                  { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
                ],
              },
            ],
          },
        },
      },
      {
        $unwind: {
          path: "$items",
        },
      },
      {
        $addFields: {
          serviceObjectId: { $toObjectId: "$items.serviceId" },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceObjectId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
        },
      },
      {
        $project: {
          custId: "$customer.custId",
          custName: "$customer.name",
          serviceId: "$service.serviceId",
          serviceName: "$items.serviceName",
          sale_before: "$sub_total",
          discount: "$discount_bill",
          sale_after: "$final_total",
        },
      },

      {
        $group: {
          _id: {
            custId: "$custId",
            custName: "$custName",
            serviceId: "$serviceId",
            serviceName: "$serviceName",
          },
          sale_before: { $sum: "$sale_before" },
          discount: { $sum: "$discount" },
          sale_after: { $sum: "$sale_after" },
        },
      },
      {
        $project: {
          _id: 0,
          custId: "$_id.custId",
          custName: "$_id.custName",
          serviceId: "$_id.serviceId",
          serviceName: "$_id.serviceName",
          sale_before: "$sale_before",
          discount: "$discount",
          sale_after: "$sale_after",
        },
      },
      {
        $group: {
          _id: {
            custId: "$custId",
            custName: "$custName",
          },
          items: {
            $push: {
              // custId: "$custId",
              // custName: "$custName",
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              sale_before: "$sale_before",
              discount: "$discount",
              sale_after: "$sale_after",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          custId: "$_id.custId",
          custName: "$_id.custName",
          items: "$items",
        },
      },

      {
        $unwind: "$items",
      },
      {
        $sort: {
          custId: 1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $group: {
          _id: {
            custId: "$custId",
            custName: "$custName",
          },
          items: { $push: "$items" },
        },
      },
      {
        $project: {
          _id: 0,
          custId: "$_id.custId",
          custName: "$_id.custName",
          items: "$items",
        },
      },
    ];
    const result = await Invoice.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      totalCount: count[0].totalCount,
      totalPage: Math.ceil(count[0].totalCount / limit),
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const statisticsByCustomerExportCSVService = async (fromDate, toDate) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $set: {
          items: {
            $map: {
              input: "$items",
              as: "service",
              in: {
                serviceId: "$$service.serviceId",
                serviceName: "$$service.serviceName",
                price: "$$service.price",
                discount: "$$service.discount",
                amount: {
                  $subtract: [
                    "$$service.price",
                    {
                      $multiply: [
                        "$$service.price",
                        { $divide: ["$$service.discount", 100] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          sub_total: { $sum: "$items.amount" },
          discount_bill: {
            $min: [
              "$discount.value_max",
              { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
            ],
          },
          final_total: {
            $subtract: [
              { $sum: "$items.amount" },
              {
                $min: [
                  "$discount.value_max",
                  { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
                ],
              },
            ],
          },
        },
      },
      {
        $unwind: {
          path: "$items",
        },
      },
      {
        $addFields: {
          serviceObjectId: { $toObjectId: "$items.serviceId" },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceObjectId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
        },
      },
      {
        $project: {
          custId: "$customer.custId",
          custName: "$customer.name",
          serviceId: "$service.serviceId",
          serviceName: "$items.serviceName",
          sale_before: "$sub_total",
          discount: "$discount_bill",
          sale_after: "$final_total",
        },
      },

      {
        $group: {
          _id: {
            custId: "$custId",
            custName: "$custName",
            serviceId: "$serviceId",
            serviceName: "$serviceName",
          },
          sale_before: { $sum: "$sale_before" },
          discount: { $sum: "$discount" },
          sale_after: { $sum: "$sale_after" },
        },
      },
      {
        $project: {
          _id: 0,
          custId: "$_id.custId",
          custName: "$_id.custName",
          serviceId: "$_id.serviceId",
          serviceName: "$_id.serviceName",
          sale_before: "$sale_before",
          discount: "$discount",
          sale_after: "$sale_after",
        },
      },
      {
        $group: {
          _id: {
            custId: "$custId",
            custName: "$custName",
          },
          items: {
            $push: {
              // custId: "$custId",
              // custName: "$custName",
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              sale_before: "$sale_before",
              discount: "$discount",
              sale_after: "$sale_after",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          custId: "$_id.custId",
          custName: "$_id.custName",
          items: "$items",
        },
      },
    ];
    const result = await Invoice.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const statisticsByStaffService = async (fromDate, toDate, page, limit) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const count = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $addFields: {
          localDate: {
            $dateAdd: {
              startDate: "$createdAt",
              unit: "hour",
              amount: 7,
            },
          },
        },
      },
      {
        $project: {
          staffId: "$staff.staffId",
          date: {
            $concat: [
              { $toString: { $dayOfMonth: "$localDate" } },
              "/",
              { $toString: { $month: "$localDate" } },
              "/",
              { $toString: { $year: "$localDate" } },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            staffId: "$staffId",
            date: "$date",
          },
        },
      },
      { $count: "totalCount" },
    ]);
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $set: {
          items: {
            $map: {
              input: "$items",
              as: "service",
              in: {
                serviceId: "$$service.serviceId",
                serviceName: "$$service.serviceName",
                price: "$$service.price",
                discount: "$$service.discount",
                amount: {
                  $subtract: [
                    "$$service.price",
                    {
                      $multiply: [
                        "$$service.price",
                        { $divide: ["$$service.discount", 100] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          localDate: {
            $dateAdd: {
              startDate: "$createdAt",
              unit: "hour",
              amount: 7,
            },
          },
          sub_total: { $sum: "$items.amount" },
          discount_bill: {
            $min: [
              "$discount.value_max",
              { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
            ],
          },
          final_total: {
            $subtract: [
              { $sum: "$items.amount" },
              {
                $min: [
                  "$discount.value_max",
                  { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          staffId: "$staff.staffId",
          staffName: "$staff.name",
          date: {
            $concat: [
              { $toString: { $dayOfMonth: "$localDate" } },
              "/",
              { $toString: { $month: "$localDate" } },
              "/",
              { $toString: { $year: "$localDate" } },
            ],
          },
          sale_before: "$sub_total",
          discount: "$discount_bill",
          sale_after: "$final_total",
        },
      },

      {
        $group: {
          _id: {
            staffId: "$staffId",
            staffName: "$staffName",
            date: "$date",
          },
          sale_before: { $sum: "$sale_before" },
          discount: { $sum: "$discount" },
          sale_after: { $sum: "$sale_after" },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: "$_id.staffId",
          staffName: "$_id.staffName",
          date: "$_id.date",
          total_sale_before: "$sale_before",
          total_discount: "$discount",
          total_sale_after: "$sale_after",
        },
      },
      {
        $group: {
          _id: {
            staffId: "$staffId",
            staffName: "$staffName",
          },
          total_sale_before: { $sum: "$total_sale_before" },
          total_discount: { $sum: "$total_discount" },
          total_sale_after: { $sum: "$total_sale_after" },
          items: {
            $push: {
              date: "$date",
              total_sale_before: "$total_sale_before",
              total_discount: "$total_discount",
              total_sale_after: "$total_sale_after",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: "$_id.staffId",
          staffName: "$_id.staffName",
          total_sale_before: "$total_sale_before",
          total_discount: "$total_discount",
          total_sale_after: "$total_sale_after",
          items: "$items",
        },
      },
      {
        $group: {
          _id: null,
          total_sale_before: { $sum: "$total_sale_before" },
          total_discount: { $sum: "$total_discount" },
          total_sale_after: { $sum: "$total_sale_after" },
          items: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },

      { $unwind: "$items" },
      { $unwind: "$items.items" },
      {
        $sort: {
          "items.staffId": 1,
          "items.items.date": 1,
        },
      },
      { $skip: (page - 1) * limit },
      {
        $limit: limit,
      },
      {
        $group: {
          _id: {
            staffId: "$items.staffId",
            staffName: "$items.staffName",
          },
          total_sale_before: { $first: "$items.total_sale_before" },
          total_discount: { $first: "$items.total_discount" },
          total_sale_after: { $first: "$items.total_sale_after" },
          total_sale_before_all_staff: { $first: "$total_sale_before" },
          total_discount_all_staff: { $first: "$total_discount" },
          total_sale_after_all_staff: { $first: "$total_sale_after" },
          items: { $push: "$items.items" },
        },
      },
      {
        $group: {
          _id: null,
          total_sale_before: { $first: "$total_sale_before_all_staff" },
          total_discount: { $first: "$total_discount_all_staff" },
          total_sale_after: { $first: "$total_sale_after_all_staff" },
          items: {
            $push: {
              staffId: "$_id.staffId",
              staffName: "$_id.staffName",
              total_sale_before: "$total_sale_before",
              total_discount: "$total_discount",
              total_after: "$total_sale_after",
              items: "$items",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];
    const result = await Invoice.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      totalCount: count[0].totalCount,
      totalPage: Math.ceil(count[0].totalCount / limit),
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const statisticsByStaffExportCSVService = async (fromDate, toDate) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },
      {
        $set: {
          items: {
            $map: {
              input: "$items",
              as: "service",
              in: {
                serviceId: "$$service.serviceId",
                serviceName: "$$service.serviceName",
                price: "$$service.price",
                discount: "$$service.discount",
                amount: {
                  $subtract: [
                    "$$service.price",
                    {
                      $multiply: [
                        "$$service.price",
                        { $divide: ["$$service.discount", 100] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          localDate: {
            $dateAdd: {
              startDate: "$createdAt",
              unit: "hour",
              amount: 7,
            },
          },
          sub_total: { $sum: "$items.amount" },
          discount_bill: {
            $min: [
              "$discount.value_max",
              { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
            ],
          },
          final_total: {
            $subtract: [
              { $sum: "$items.amount" },
              {
                $min: [
                  "$discount.value_max",
                  { $multiply: [{ $sum: "$items.amount" }, "$discount.per"] },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          staffId: "$staff.staffId",
          staffName: "$staff.name",
          date: {
            $concat: [
              { $toString: { $dayOfMonth: "$localDate" } },
              "/",
              { $toString: { $month: "$localDate" } },
              "/",
              { $toString: { $year: "$localDate" } },
            ],
          },
          sale_before: "$sub_total",
          discount: "$discount_bill",
          sale_after: "$final_total",
        },
      },

      {
        $group: {
          _id: {
            staffId: "$staffId",
            staffName: "$staffName",
            date: "$date",
          },
          sale_before: { $sum: "$sale_before" },
          discount: { $sum: "$discount" },
          sale_after: { $sum: "$sale_after" },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: "$_id.staffId",
          staffName: "$_id.staffName",
          date: "$_id.date",
          total_sale_before: "$sale_before",
          total_discount: "$discount",
          total_sale_after: "$sale_after",
        },
      },
      {
        $group: {
          _id: {
            staffId: "$staffId",
            staffName: "$staffName",
          },
          total_sale_before: { $sum: "$total_sale_before" },
          total_discount: { $sum: "$total_discount" },
          total_sale_after: { $sum: "$total_sale_after" },
          items: {
            $push: {
              date: "$date",
              total_sale_before: "$total_sale_before",
              total_discount: "$total_discount",
              total_sale_after: "$total_sale_after",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: "$_id.staffId",
          staffName: "$_id.staffName",
          total_sale_before: "$total_sale_before",
          total_discount: "$total_discount",
          total_sale_after: "$total_sale_after",
          items: "$items",
        },
      },
      {
        $group: {
          _id: null,
          total_sale_before: { $sum: "$total_sale_before" },
          total_discount: { $sum: "$total_discount" },
          total_sale_after: { $sum: "$total_sale_after" },
          items: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];
    const result = await Invoice.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const statisticsServiceRefundService = async (
  fromDate,
  toDate,
  page,
  limit
) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const count = await InvoiceRefund.aggregate([
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },

      {
        $unwind: "$invoice.items",
      },
      { $count: "totalCount" },
    ]);
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },

      {
        $unwind: "$invoice.items",
      },

      {
        $addFields: {
          serviceObjectId: { $toObjectId: "$invoice.items.serviceId" },
        },
      },

      {
        $lookup: {
          from: "services",
          localField: "serviceObjectId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: "$service",
      },
      {
        $project: {
          _id: 0,
          saleInvoiceId: "$invoice.invoiceId",
          saleInvoiceCreatedAt: {
            $concat: [
              { $toString: { $dayOfMonth: "$invoice.createdAt" } },
              "/",
              { $toString: { $month: "$invoice.createdAt" } },
              "/",
              { $toString: { $year: "$invoice.createdAt" } },
            ],
          },
          refundInvoiceId: "$invoiceRefundId",
          refundInvoiceCreatedAt: {
            $concat: [
              { $toString: { $dayOfMonth: "$createdAt" } },
              "/",
              { $toString: { $month: "$createdAt" } },
              "/",
              { $toString: { $year: "$createdAt" } },
            ],
          },
          serviceId: "$service.serviceId",
          serviceName: "$service.serviceName",
          amount: {
            $subtract: [
              "$invoice.items.price",
              {
                $multiply: [
                  "$invoice.items.price",
                  { $divide: ["$invoice.items.discount", 100] },
                ],
              },
            ],
          },
        },
      },

      {
        $group: {
          _id: {
            saleInvoiceId: "$saleInvoiceId",
            saleInvoiceCreatedAt: "$saleInvoiceCreatedAt",
            refundInvoiceId: "$refundInvoiceId",
            refundInvoiceCreatedAt: "$refundInvoiceCreatedAt",
          },
          total_amount: { $sum: "$amount" },
          items: {
            $push: {
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              amount: "$amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          saleInvoiceId: "$_id.saleInvoiceId",
          saleInvoiceCreatedAt: "$_id.saleInvoiceCreatedAt",
          refundInvoiceId: "$_id.refundInvoiceId",
          refundInvoiceCreatedAt: "$_id.refundInvoiceCreatedAt",
          total_amount: "$total_amount",
          items: "$items",
        },
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$total_amount" },
          items: {
            $push: {
              saleInvoiceId: "$saleInvoiceId",
              saleInvoiceCreatedAt: "$saleInvoiceCreatedAt",
              refundInvoiceId: "$refundInvoiceId",
              refundInvoiceCreatedAt: "$refundInvoiceCreatedAt",
              items: "$items",
            },
          },
        },
      },

      { $unwind: "$items" },
      { $unwind: "$items.items" },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $group: {
          _id: {
            saleInvoiceId: "$items.saleInvoiceId",
            saleInvoiceCreatedAt: "$items.saleInvoiceCreatedAt",
            refundInvoiceId: "$items.refundInvoiceId",
            refundInvoiceCreatedAt: "$items.refundInvoiceCreatedAt",
          },
          total_amount: { $first: "$total_amount" },
          items: { $push: "$items.items" },
        },
      },

      {
        $group: {
          _id: null,
          total_amount: { $first: "$total_amount" },
          items: {
            $push: {
              saleInvoiceId: "$_id.saleInvoiceId",
              saleInvoiceCreatedAt: "$_id.saleInvoiceCreatedAt",
              refundInvoiceId: "$_id.refundInvoiceId",
              refundInvoiceCreatedAt: "$_id.refundInvoiceCreatedAt",
              items: "$items",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];
    const result = await InvoiceRefund.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      totalCount: count[0].totalCount,
      totalPage: Math.ceil(count[0].totalCount / limit),
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const statisticsServiceRefundExportCSVService = async (fromDate, toDate) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: t1 },
          createdAt: { $lte: t2 },
        },
      },

      {
        $unwind: "$invoice.items",
      },

      {
        $addFields: {
          serviceObjectId: { $toObjectId: "$invoice.items.serviceId" },
        },
      },

      {
        $lookup: {
          from: "services",
          localField: "serviceObjectId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: "$service",
      },
      {
        $project: {
          _id: 0,
          saleInvoiceId: "$invoice.invoiceId",
          saleInvoiceCreatedAt: {
            $concat: [
              { $toString: { $dayOfMonth: "$invoice.createdAt" } },
              "/",
              { $toString: { $month: "$invoice.createdAt" } },
              "/",
              { $toString: { $year: "$invoice.createdAt" } },
            ],
          },
          refundInvoiceId: "$invoiceRefundId",
          refundInvoiceCreatedAt: {
            $concat: [
              { $toString: { $dayOfMonth: "$createdAt" } },
              "/",
              { $toString: { $month: "$createdAt" } },
              "/",
              { $toString: { $year: "$createdAt" } },
            ],
          },
          serviceId: "$service.serviceId",
          serviceName: "$service.serviceName",
          amount: {
            $subtract: [
              "$invoice.items.price",
              {
                $multiply: [
                  "$invoice.items.price",
                  { $divide: ["$invoice.items.discount", 100] },
                ],
              },
            ],
          },
        },
      },

      {
        $group: {
          _id: {
            saleInvoiceId: "$saleInvoiceId",
            saleInvoiceCreatedAt: "$saleInvoiceCreatedAt",
            refundInvoiceId: "$refundInvoiceId",
            refundInvoiceCreatedAt: "$refundInvoiceCreatedAt",
          },
          total_amount: { $sum: "$amount" },
          items: {
            $push: {
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              amount: "$amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          saleInvoiceId: "$_id.saleInvoiceId",
          saleInvoiceCreatedAt: "$_id.saleInvoiceCreatedAt",
          refundInvoiceId: "$_id.refundInvoiceId",
          refundInvoiceCreatedAt: "$_id.refundInvoiceCreatedAt",
          total_amount: "$total_amount",
          items: "$items",
        },
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$total_amount" },
          items: {
            $push: {
              saleInvoiceId: "$saleInvoiceId",
              saleInvoiceCreatedAt: "$saleInvoiceCreatedAt",
              refundInvoiceId: "$refundInvoiceId",
              refundInvoiceCreatedAt: "$refundInvoiceCreatedAt",
              items: "$items",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];
    const result = await InvoiceRefund.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
const statisticsPromotionResultService = async (
  fromDate,
  toDate,
  page,
  limit
) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const count = await Promotion.aggregate([
      {
        $match: {
          $or: [
            { startDate: { $lte: t1 }, endDate: { $gte: t2 } },
            { endDate: { $gte: t1 }, endDate: { $lte: t2 } },
            { startDate: { $gte: t1 }, endDate: { $lte: t2 } },
          ],
        },
      },

      {
        $addFields: {
          parentId: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "promotion_lines",
          localField: "parentId",
          foreignField: "parentId",
          as: "lines",
        },
      },
      {
        $unwind: {
          path: "$lines",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$lines.detail",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $count: "totalCount" },
    ]);
    const pipeline = [
      {
        $match: {
          $or: [
            { startDate: { $lte: t1 }, endDate: { $gte: t2 } },
            { endDate: { $gte: t1 }, endDate: { $lte: t2 } },
            { startDate: { $gte: t1 }, endDate: { $lte: t2 } },
          ],
        },
      },

      {
        $addFields: {
          parentId: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "promotion_lines",
          localField: "parentId",
          foreignField: "parentId",
          as: "lines",
        },
      },
      {
        $unwind: {
          path: "$lines",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$lines.detail",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          promotionId: "$promotionId",
          promotionName: "$promotionName",
          startDate: {
            $concat: [
              { $toString: { $dayOfMonth: "$startDate" } },
              "/",
              { $toString: { $month: "$startDate" } },
              "/",
              { $toString: { $year: "$startDate" } },
            ],
          },
          endDate: {
            $concat: [
              { $toString: { $dayOfMonth: "$endDate" } },
              "/",
              { $toString: { $month: "$endDate" } },
              "/",
              { $toString: { $year: "$endDate" } },
            ],
          },
          lineId: { $toString: "$lines._id" },
          detailId: "$lines.detail.code",
          type: "$lines.type",
          itemGiftId: { $toObjectId: "$lines.detail.itemGiftId" },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "itemGiftId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "promotion_results",
          localField: "detailId",
          foreignField: "code",
          as: "results",
        },
      },
      {
        $project: {
          promotionId: "$promotionId",
          promotionName: "$promotionName",
          startDate: "$startDate",
          endDate: "$endDate",
          type: "$type",
          serviceId: "$service.serviceId",
          serviceName: "$service.serviceName",
          total_apply: { $size: "$results" },
          total_amount: {
            $reduce: {
              input: "$results",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.value"] },
            },
          },
        },
      },
      {
        $sort: {
          promotionId: 1,
        },
      },
      {
        $group: {
          _id: {
            promotionId: "$promotionId",
            promotionName: "$promotionName",
            startDate: "$startDate",
            endDate: "$endDate",
          },

          items: {
            $push: {
              type: "$type",
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              total_apply: "$total_apply",
              total_amount: "$total_amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          promotionId: "$_id.promotionId",
          promotionName: "$_id.promotionName",
          startDate: "$_id.startDate",
          endDate: "$_id.endDate",
          items: "$items",
        },
      },
      { $unwind: "$items" },
      {
        $sort: {
          promotionId: 1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $group: {
          _id: {
            promotionId: "$promotionId",
            promotionName: "$promotionName",
            startDate: "$startDate",
            endDate: "$endDate",
          },
          items: { $push: "$items" },
        },
      },
      {
        $project: {
          _id: 0,
          promotionId: "$_id.promotionId",
          promotionName: "$_id.promotionName",
          startDate: "$_id.startDate",
          endDate: "$_id.endDate",
          items: "$items",
        },
      },
    ];
    const result = await Promotion.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      totalCount: count[0].totalCount,
      totalPage: Math.ceil(count[0].totalCount / limit),
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
};
const statisticsPromotionResultExportCSVService = async (fromDate, toDate) => {
  try {
    let t1 = new Date(fromDate);
    let t2 = new Date(toDate);
    t1.setHours(0, 0, 0, 0);
    t2.setDate(t2.getDate() + 1);
    t2.setHours(0, 0, 0, 0);
    const pipeline = [
      {
        $match: {
          $or: [
            { startDate: { $lte: t1 }, endDate: { $gte: t2 } },
            { endDate: { $gte: t1 }, endDate: { $lte: t2 } },
            { startDate: { $gte: t1 }, endDate: { $lte: t2 } },
          ],
        },
      },
      {
        $addFields: {
          parentId: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "promotion_lines",
          localField: "parentId",
          foreignField: "parentId",
          as: "lines",
        },
      },
      {
        $unwind: {
          path: "$lines",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$lines.detail",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          promotionId: "$promotionId",
          promotionName: "$promotionName",
          startDate: {
            $concat: [
              { $toString: { $dayOfMonth: "$startDate" } },
              "/",
              { $toString: { $month: "$startDate" } },
              "/",
              { $toString: { $year: "$startDate" } },
            ],
          },
          endDate: {
            $concat: [
              { $toString: { $dayOfMonth: "$endDate" } },
              "/",
              { $toString: { $month: "$endDate" } },
              "/",
              { $toString: { $year: "$endDate" } },
            ],
          },
          lineId: { $toString: "$lines._id" },
          detailId: "$lines.detail.code",
          type: "$lines.type",
          itemGiftId: { $toObjectId: "$lines.detail.itemGiftId" },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "itemGiftId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "promotion_results",
          localField: "detailId",
          foreignField: "code",
          as: "results",
        },
      },
      {
        $project: {
          promotionId: "$promotionId",
          promotionName: "$promotionName",
          startDate: "$startDate",
          endDate: "$endDate",
          type: "$type",
          serviceId: "$service.serviceId",
          serviceName: "$service.serviceName",
          total_apply: { $size: "$results" },
          total_amount: {
            $reduce: {
              input: "$results",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.value"] },
            },
          },
        },
      },
      {
        $sort: {
          promotionId: 1,
        },
      },
      {
        $group: {
          _id: {
            promotionId: "$promotionId",
            promotionName: "$promotionName",
            startDate: "$startDate",
            endDate: "$endDate",
          },

          items: {
            $push: {
              type: "$type",
              serviceId: "$serviceId",
              serviceName: "$serviceName",
              total_apply: "$total_apply",
              total_amount: "$total_amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          promotionId: "$_id.promotionId",
          promotionName: "$_id.promotionName",
          startDate: "$_id.startDate",
          endDate: "$_id.endDate",
          items: "$items",
        },
      },
    ];
    const result = await Promotion.aggregate(pipeline);
    return {
      code: 200,
      message: "Thành công",
      data: result,
    };
  } catch (error) {
    console.log("Error in statisticsByCustomerService", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      data: null,
    };
  }
};
module.exports = {
  statisticsByCustomerService,
  statisticsByCustomerExportCSVService,
  statisticsByStaffService,
  statisticsByStaffExportCSVService,
  statisticsServiceRefundService,
  statisticsServiceRefundExportCSVService,
  statisticsPromotionResultService,
  statisticsPromotionResultExportCSVService,
};
