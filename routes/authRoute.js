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
router.get('/google/status', (req, res) => {
  return res.json({ enabled: Boolean(passport._strategies && passport._strategies['google']) });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
  if (!req.user) {
    console.warn('[AUTH][google/callback] no user found after authentication');
    return res.redirect('/');
  }

  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Determine frontend URL
  const frontendUrl = process.env.FRONTEND_URL || (isProduction ? 'https://asianfood.vercel.app' : 'http://localhost:3000');
  const rawState = req.query.state ? decodeURIComponent(req.query.state) : null;
  let redirectTarget = frontendUrl;

  if (rawState) {
    if (rawState.startsWith('/')) {
      redirectTarget = defaultFrontend.replace(/\/$/, '') + rawState;
    } else if (process.env.FRONTEND_URL && rawState.startsWith(process.env.FRONTEND_URL)) {
      redirectTarget = rawState;
    } else {
      console.warn('[AUTH][google/callback] rejected unsafe state redirect:', rawState);
    }
  }

  console.log(`[AUTH][google/callback] user=${req.user?._id} redirecting to ${redirectTarget}`);
  return res.redirect(redirectTarget);
});

export default router;
