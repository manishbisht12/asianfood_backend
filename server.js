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

// ================= SOCKET.IO =================
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
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
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(passport.initialize());

console.log("ENV API KEY:", process.env.CLOUDINARY_API_KEY);

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
httpServer.listen(process.env.PORT || 4000, () => {
  console.log(`✅ Server running on PORT ${process.env.PORT || 4000}`);
});
