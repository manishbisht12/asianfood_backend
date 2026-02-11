import express from "express";
import {
    getFoods,
    createFood,
    searchFood,
} from "../controllers/foodController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/foods", getFoods);
router.post("/create", upload.single("image"), createFood);
router.get("/search", searchFood);

export default router;
