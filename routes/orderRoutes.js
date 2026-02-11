import express from "express";
import { createCODOrder } from "../controllers/orderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/cod", protect, createCODOrder);

export default router;
