import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdmin,
  uploadFileTypes,
} from "../controllers/admins/adminController.js";
import { adminAuth, superAdminAuth } from "../middlewares/adminMiddleware.js";

import { upload } from "../utils/handleFileUpload.js";

const router = express.Router();

// Public routes
router.post("/register", superAdminAuth, registerAdmin);
router.post("/login", loginAdmin);

// Protected routes
router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdmin);
router.post("/upload", adminAuth, upload.single("file"), uploadFileTypes);

export default router;
