import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../config/brevoEmail.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[AUTH][login] request body keys:', Object.keys(req.body), 'hasEmail=', !!email, 'hasPassword=', password ? 'present' : 'missing');
    console.log('[AUTH][login] origin:', req.headers.origin || req.get('origin'), 'content-type:', req.get('Content-Type'));

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password is  required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(400).json({ message: " Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    console.log(`[AUTH][login] login successful for email=${email} userId=${user._id}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const signup = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: "Name ,Email and mobile required" });
    }

    const userByEmail = await User.findOne({ email });
    const userByMobile = await User.findOne({ mobile });

    // Case 1: Same user (email + mobile)
    if (
      userByEmail &&
      userByMobile &&
      userByEmail._id.toString() === userByMobile._id.toString()
    ) {
      if (userByEmail.otpExpiresAt && userByEmail.otpExpiresAt > Date.now()) {
        return res.status(400).json({
          message: "OTP already sent, please wait",
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      userByEmail.otp = otp;
      userByEmail.otpExpiresAt = otpExpiresAt;
      userByEmail.otpVerified = false;

      await userByEmail.save();
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error("[AUTH][signup] resend OTP email failed:", emailError.message);
        return res.status(500).json({
          message: "Failed to send OTP email. Please try again.",
          error: emailError.message,
        });
      }

      return res.status(200).json({
        message: "OTP resent successfully to email",
      });
    }

    // Case 2: Email OR mobile exists
    if (userByEmail || userByMobile) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Case 3: New user
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.create({
      name,
      email,
      mobile,
      otp,
      otpExpiresAt,
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("[AUTH][signup] new user OTP email failed:", emailError.message);
      return res.status(500).json({
        message: "Failed to send OTP email. Please try again.",
        error: emailError.message,
      });
    }

    res.status(200).json({
      message: "OTP sent successfully to email",
    });
  } catch (error) {
    console.error("Signup error:", error?.response?.data || error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.otpVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const setPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ otpVerified: true });

    if (!user || !user.otpVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.isVerified = true;
    user.otpVerified = false;

    await user.save();

    res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp");

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


