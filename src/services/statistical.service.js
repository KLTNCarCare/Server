const { Invoice } = require("../models/invoice.model");

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
    console.log(t1, t2);
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
module.exports = {
  statisticsByCustomerService,
  statisticsByCustomerExportCSVService,
  statisticsByStaffService,
  statisticsByStaffExportCSVService,
};
