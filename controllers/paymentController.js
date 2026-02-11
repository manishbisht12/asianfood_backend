import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";


export const createOrder = async (req, res) => {
  try {
    const { amount, paymentMethod, items } = req.body;
    const userId = req.user._id;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    const newOrder = await Order.create({
      userId,
      items,
      razorpayOrderId: order.id,
      amount,
      paymentMethod,
      paymentStatus: "PENDING",
    });

    console.log("📝 Created new order (PENDING):", {
      orderId: newOrder._id,
      razorpayOrderId: order.id,
      userId
    });

    res.status(200).json({
      success: true,
      order,
      dbOrder: newOrder,
    });
  } catch (error) {
    console.error("Payment Order Error:", error);
    res.status(500).json({ success: false, message: "Payment order failed", error: error.message });
  }
};



export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    console.log("🔍 Finding order for update:", { razorpay_order_id, userId: req.user._id });


    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "PAID",
      },
      { new: true }
    );

    if (!order) {
      console.log("❌ Order NOT found in DB. Check if razorpayOrderId matches.");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    console.log("✅ Order updated to PAID:", order._id);


    res.status(200).json({
      success: true,
      message: "Order placed and payment received! 🎉",
      order,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
