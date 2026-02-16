import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import {
    login,
    logout,
    signup,
    verifyOtp,
    setPassword,
    getUsers,
    getProfile,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Native Auth Routes
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", protect, getUsers);
router.get("/me", protect, getProfile);

// Google Auth Routes
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
        });

        res.redirect("http://localhost:3000");
    }
);

export default router;
