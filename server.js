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
const httpServer = createServer(app);

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "http://localhost:3000",
  "https://asianfood-steel.vercel.app"
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
