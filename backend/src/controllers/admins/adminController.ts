import { Request, Response } from "express";
import { adminService } from "../../services/adminService.js";
import {
  AdminLoginSchema,
  AdminRegistrationSchema,
  AdminUpdateSchema,
} from "./authSchema.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
} from "../../utils/responseUtils.js";
import { setRefreshTokenCookie } from "../../utils/cookieUtils.js";
import { z } from "zod";

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = AdminRegistrationSchema.parse(req.body);

    // Check if admin already exists
    const existingAdmin = await adminService.findAdminByEmail(
      validatedData.email
    );

    if (existingAdmin) {
      return createErrorResponse(res, 400, "Admin already exists");
    }

    const admin = await adminService.createAdmin(validatedData);

    // Generate tokens
    const { accessToken, refreshToken } = adminService.generateAuthTokens(
      admin._id.toString()
    );

    // Update refresh token in DB
    await adminService.updateRefreshToken(admin._id.toString(), refreshToken);

    setRefreshTokenCookie(res, refreshToken);

    // Return success response
    createSuccessResponse(res, 201, "Admin created successfully", {
      admin: {
        adminId: admin._id,
        email: admin.email,
        fullName: admin.fullName,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error("Admin registration error:", error);
    createErrorResponse(res, 500, "Failed to register admin");
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = AdminLoginSchema.parse(req.body);

    const admin = await adminService.findAdminByEmail(email);

    if (!admin) {
      return createErrorResponse(res, 401, "Invalid credentials");
    }

    const isMatch = await adminService.validatePassword(
      password,
      admin.password
    );

    if (!isMatch) {
      console.log(password);
      return createErrorResponse(res, 401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = adminService.generateAuthTokens(
      admin._id.toString()
    );

    // Update refresh token in DB
    await adminService.updateRefreshToken(admin._id.toString(), refreshToken);

    setRefreshTokenCookie(res, refreshToken);

    // Return success response
    createSuccessResponse(res, 200, "Login successful", {
      admin: {
        adminId: admin._id,
        email: admin.email,
        fullName: admin.fullName,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    createErrorResponse(res, 500, "Failed to login admin");
  }
};

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const admin = await adminService.findAdminById(req.user.id);
    if (!admin) {
      return createErrorResponse(res, 404, "Admin not found");
    }

    createSuccessResponse(res, 200, "Admin profile retrieved", {
      admin: {
        adminId: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    createErrorResponse(res, 500, "Failed to get admin profile");
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = AdminUpdateSchema.parse(req.body);
    const admin = await adminService.updateAdmin(req.user.id, validatedData);

    if (!admin) {
      return createErrorResponse(res, 404, "Admin not found");
    }

    createSuccessResponse(res, 200, "Admin updated successfully", {
      admin: {
        adminId: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    createErrorResponse(res, 500, "Failed to update admin");
  }
};
