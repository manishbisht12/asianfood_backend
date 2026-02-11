// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     razorpayOrderId: String,
//     amount: Number,
//     currency: String,
//     status: {
//       type: String,
//       default: "created",
//     },
//     paymentMethod: String,
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);




// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: Array,
    amount: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentMethod: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
