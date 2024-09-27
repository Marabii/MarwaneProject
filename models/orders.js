const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartItemSchema = new Schema(
  {
    productId: {
      type: String,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    bonus: {
      type: Number,
      required: false,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrdersSchema = new Schema(
  {
    cart: [CartItemSchema],
    email: { type: String, required: false },
    phoneNumber: { type: String, required: true },
    fullName: { type: String, required: true },
    country: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    address: { type: String, required: false },
    totalAmount: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: () => new Date() },
    isSuccessfulPageSeen: { type: Boolean, default: false },
  },
  { collection: "orders", timestamps: true }
);

const Order = mongoose.model("Order", OrdersSchema);

module.exports = Order;
