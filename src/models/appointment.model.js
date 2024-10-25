const mongoose = require("mongoose");
const {
  findCustByPhone,
  pushVehicle,
  createCustomer,
} = require("../services/customer.service");
const { phoneNumberRegex } = require("../utils/regex");
const customerSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    custId: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      match: [phoneNumberRegex, "Số điện thoại không hợp lệ"],
    },

    name: { type: String, required: true },
  },
  { _id: false }
);
const vehicleSchema = mongoose.Schema(
  {
    licensePlate: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const discountSchema = mongoose.Schema(
  {
    per: {
      type: Number,
      default: 0,
      max: 100,
    },
    value_max: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
const serviceSchema = mongoose.Schema(
  {
    typeId: {
      type: String,
      required: true,
    },
    typeName: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["pending", "in-progess", "completed", "canceled"],
      default: "pending",
    },
  },
  { _id: false, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);
serviceSchema.virtual("total").get(function () {
  const total = this.price * (1 - this.discount / 100);

  return total;
});
const paymentSchema = mongoose.Schema({
  method: {
    type: String,
    enum: ["cast", "bank-transfer", "digital-wallet"],
    default: "cast",
  },
  status: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
});
const PromotionSchema = mongoose.Schema(
  {
    promotion_line: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false }
);
const appointmentSchema = mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    vehicle: {
      type: vehicleSchema,
      required: true,
    },
    total_duration: {
      type: Number,
      min: 0,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    startActual: {
      type: Date,
      required: true,
    },
    endActual: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "canceled",
        "rescheduled",
        "missed",
      ],
      default: "pending",
    },
    discount: {
      type: discountSchema,
      default: {
        per: 0,
        value_max: 0,
      },
    },
    promotion: {
      type: [PromotionSchema],
      default: [],
    },
    payment: {
      type: paymentSchema,
    },
    invoiceCreated: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [serviceSchema],
      required: true,
      validate: {
        validator: function (items) {
          const itemIds = items.map((item) => item.serviceId);
          return itemIds.length === new Set(itemIds).size;
        },
        message: "Dịch vụ trong một đơn hàng phải là duy nhất",
      },
    },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);
appointmentSchema.virtual("sub_total").get(function () {
  return this.items.reduce(
    (total, service) => total + service.price * (1 - service.discount / 100),
    0
  );
});

appointmentSchema.virtual("final_total").get(function () {
  const value_max = this.discount.value_max;
  const sub_total = this.sub_total;
  const discountValue = (sub_total * this.discount.per) / 100;

  return discountValue > value_max
    ? sub_total - value_max
    : sub_total - discountValue;
});
appointmentSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = new Date();
    this.setUpdate(update); // Đảm bảo cập nhật lại giá trị
  }
  next();
});
appointmentSchema.post("save", async function (doc) {
  try {
    const result = await findCustByPhone(doc.customer.phone);
    if (result) {
      await pushVehicle(result._id, doc.vehicle);
    } else {
      const customer = {
        phone: doc.customer.phone,
        name: doc.customer.name,
        vehicles: [doc.vehicle],
      };
      await createCustomer(customer);
    }
  } catch (error) {
    console.log("Error occurred during post save hook", error);
  }
});
const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
