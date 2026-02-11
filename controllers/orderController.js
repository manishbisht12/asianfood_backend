
import Order from "../models/Order.js";

export const createCODOrder = async (req, res) => {
  try {
    const { userId, items, amount } = req.body;

    const order = await Order.create({
      userId,
      items,
      amount,
      paymentMethod: "offline",
      paymentStatus: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "COD Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "COD order failed",
    });
  }
};
