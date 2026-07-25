const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ================= CONNECT MONGODB ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

/* ================= USER MODEL ================= */

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("users", UserSchema);

/* ================= MEDICAL MODEL ================= */

const MedicalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  fullName: String,
  email: String,
  phone: String,
  age: Number,
  gender: String,
  bloodGroup: String,
  height: Number,
  weight: Number,
  fitnessGoals: [String],
  foodPreferences: [String],
  foodAllergies: [String],
  medicalConditions: [String],
  lifestyle: Object,
  additionalNotes: String,
  updatedAt: { type: Date, default: Date.now }
});

const MedicalProfile = mongoose.model("medicalprofiles", MedicalSchema);

/* ================= FEEDBACK MODEL ================= */

const FeedbackSchema = new mongoose.Schema({
  userId: String,
  rating: Number,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model("feedbacks", FeedbackSchema);

/* ================= OTP & RESET IN-MEMORY STORE ================= */

const otps = new Map();

/* ================= LOGIN (EMAIL & PASSWORD) ================= */

app.post("/login", async (req, res) => {
  const { email, phone, password, role } = req.body;

  try {
    let user = null;

    if (email) user = await User.findOne({ email, password, role });
    else if (phone) user = await User.findOne({ phone, password, role });

    if (!user) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      role: user.role,
      message: "Login Successful"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

/* ================= REGISTER ================= */

app.post("/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const exists = await User.findOne({ $or: [{ email }, { phone }] });

    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    await User.create({ name, email, phone, password, role });

    res.json({ success: true, message: "Signup Successful" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

/* ================= SEND OTP (PHONE OR EMAIL) ================= */

app.post("/api/send-otp", async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.json({ success: false, message: "Phone/Email is required" });
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  otps.set(identifier, {
    code: generatedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  console.log(`[DEMO OTP] Sent to ${identifier}: ${generatedOtp}`);

  res.json({
    success: true,
    message: `OTP sent successfully! (Demo Code: ${generatedOtp})`
  });
});

/* ================= LOGIN WITH OTP ================= */

app.post("/api/login-otp", async (req, res) => {
  const { phone, otp, role } = req.body;

  const record = otps.get(phone);

  if (!record || record.code !== otp || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "Invalid or expired OTP" });
  }

  try {
    let user = await User.findOne({ phone, role });

    if (!user) {
      return res.json({ success: false, message: "User not found with this phone number" });
    }

    otps.delete(phone);

    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      role: user.role,
      message: "Phone Login Successful!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during OTP login" });
  }
});

/* ================= RESET PASSWORD ================= */

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const record = otps.get(email);

  if (!record || record.code !== otp || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "Invalid or expired OTP" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { password: newPassword },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, message: "User with this email does not exist" });
    }

    otps.delete(email);

    res.json({ success: true, message: "Password updated successfully! You can now login." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
});

/* ================= ADMIN: GET ALL USERS ================= */

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ================= ADMIN: GET ALL MEDICAL PROFILES ================= */

app.get("/api/admin/medical", async (req, res) => {
  try {
    const profiles = await MedicalProfile.find({});
    res.json(profiles);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ================= ADMIN: GET ALL FEEDBACKS ================= */

app.get("/api/admin/feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ================= ADMIN: DELETE USER ================= */

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= ADMIN: STATS ================= */

app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMedicalProfiles = await MedicalProfile.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();

    res.json({
      totalUsers,
      activeUsers: totalUsers,
      totalMedicalProfiles,
      totalFeedbacks
    });

  } catch (err) {
    res.status(500).json({});
  }
});

/* ================= PROFILE ================= */

app.get("/api/user/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

/* ================= MEDICAL SAVE ================= */

app.post("/api/medical/save", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "User ID missing" });
    }

    const profile = await MedicalProfile.findOneAndUpdate(
      { userId },
      req.body,
      { upsert: true, new: true }
    );

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving profile" });
  }
});

/* ================= FEEDBACK SAVE ================= */

app.post("/api/feedback/save", async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    console.log("New Feedback Received:", feedback);
    res.json({ success: true, feedback });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ success: false, message: "Error saving feedback" });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});