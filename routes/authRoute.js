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

  const origin = req.headers.origin || req.get('origin');
  const requestedRedirect = req.query.redirect || req.query.state;
  console.log('[AUTH][google] start OAuth - origin=', origin, 'requestedRedirect=', requestedRedirect || null);

  let state;
  if (requestedRedirect) {
    try {
      if (requestedRedirect.startsWith('/')) {
        state = encodeURIComponent(requestedRedirect);
      } else if (process.env.FRONTEND_URL && requestedRedirect.startsWith(process.env.FRONTEND_URL)) {
        state = encodeURIComponent(requestedRedirect);
      } else {
        console.warn('[AUTH][google] rejected unsafe requestedRedirect:', requestedRedirect);
      }
    } catch (e) {
      console.warn('[AUTH][google] invalid requestedRedirect format:', requestedRedirect);
    }
  }

  const authOptions = { scope: ['profile', 'email'] };
  if (state) authOptions.state = state;

  passport.authenticate('google', authOptions)(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!passport._strategy || !passport._strategy('google')) {
    return res.status(503).json({ message: 'Google OAuth not configured on server' });
  }

  const failureRedirect = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://asianfood-steel.vercel.app' : '/');

  passport.authenticate('google', { session: false, failureRedirect })(req, res, function (err) {
    if (err) {
      console.error('[AUTH][google/callback] passport error', err);
      return res.redirect(failureRedirect);
    }

    if (!req.user) {
      console.warn('[AUTH][google/callback] no user found after authentication');
      return res.redirect(failureRedirect);
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

    // Final safety: never redirect to localhost from a production server.
    if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(redirectTarget)) {
      console.warn('[AUTH][google/callback] blocked redirect to localhost in production:', redirectTarget);
      redirectTarget = process.env.FRONTEND_URL || 'https://asianfood-steel.vercel.app';
    }

    console.log(`[AUTH][google/callback] user=${req.user?._id} redirecting to ${redirectTarget}`);
    return res.redirect(redirectTarget);
  });
});

export default router;
