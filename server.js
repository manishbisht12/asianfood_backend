import "dotenv/config";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import foodRoute from "./routes/foodRoute.js";
import reviewRoute from "./routes/reviewRoutes.js";
import orderRoute from "./routes/orderRoutes.js";
import paymentRoute from "./routes/paymentRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import "./config/passport.js";

// ================= CONNECT DB =================
connectDB();

// ================= APP & SERVER =================
const app = express();
app.set('trust proxy', 1); // trust first proxy (required when running behind a proxy/load-balancer)
const httpServer = createServer(app);

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "http://localhost:3000",
  "https://asianfood-steel.vercel.app",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// ================= SOCKET.IO =================
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ================= MIDDLEWARES =================
app.use(express.json());
app.use(cookieParser());

// ✅ CORS FIX (PRODUCTION SAFE)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(passport.initialize());

// Startup checks: warn if important env vars are missing in production
if (process.env.NODE_ENV === "production") {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.warn('[STARTUP] Missing Google OAuth env vars (GOOGLE_CLIENT_ID/SECRET/CALLBACK). Google sign-in will not work until these are set and the Google Console redirect URI matches.');
  }
  if (!process.env.FRONTEND_URL) {
    console.warn('[STARTUP] FRONTEND_URL is not set — Google callback redirect will fall back to default frontend URL.');
  }
}
console.log('[STARTUP] FRONTEND_URL=%s GOOGLE_CALLBACK_URL=%s', process.env.FRONTEND_URL || '<not-set>', process.env.GOOGLE_CALLBACK_URL || '<not-set>');

// ================= ROUTES =================
app.use("/auth", authRoutes);
app.use("/api", foodRoute);
app.use("/review", reviewRoute);
app.use("/order", orderRoute);
app.use("/payment", paymentRoute);

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ================= START SERVER =================
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on PORT ${PORT}`);
});
