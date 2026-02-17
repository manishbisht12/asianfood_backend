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
  return res.json({ enabled: Boolean(passport._strategy && passport._strategy('google')) });
});

router.get('/google', (req, res, next) => {
  if (!passport._strategy || !passport._strategy('google')) {
    return res.status(503).json({ message: 'Google OAuth not configured on server' });
  }

  console.log('[AUTH][google] start OAuth - origin=', req.headers.origin || req.get('origin'), 'requestedRedirect=', req.query.redirect || req.query.state || null);

  const state = req.query.redirect ? encodeURIComponent(req.query.redirect) : (req.query.state ? encodeURIComponent(req.query.state) : undefined);
  const authOptions = { scope: ['profile', 'email'] };
  if (state) authOptions.state = state;

  passport.authenticate('google', authOptions)(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!passport._strategy || !passport._strategy('google')) {
    return res.status(503).json({ message: 'Google OAuth not configured on server' });
  }

  passport.authenticate('google', { session: false, failureRedirect: process.env.FRONTEND_URL || '/' })(req, res, function (err) {
    if (err) {
      console.error('[AUTH][google/callback] passport error', err);
      return res.redirect(process.env.FRONTEND_URL || '/');
    }

    if (!req.user) {
      console.warn('[AUTH][google/callback] no user found after authentication');
      return res.redirect(process.env.FRONTEND_URL || '/');
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
      path: '/',
    });

    // Accept state (relative path or allowed FRONTEND_URL) and validate to prevent open-redirects
    const rawState = req.query.state ? decodeURIComponent(req.query.state) : null;
    const defaultFrontend = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://asianfood-steel.vercel.app' : 'http://localhost:3000');
    let redirectTarget = defaultFrontend;

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
});

export default router;
