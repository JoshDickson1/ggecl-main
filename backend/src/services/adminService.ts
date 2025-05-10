/* eslint-disable @typescript-eslint/no-explicit-any */

import Admin, { IAdmin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../constants/auth.js";
import { generateToken } from "../utils/generateToken.js";

class AdminService {
  async createAdmin(adminData: any) {
    const password = adminData?.password
      ? await bcrypt.hash(adminData.password, SALT_ROUNDS)
      : undefined;
    return Admin.create({
      ...adminData,
      password,
    });
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async findAdminByEmail(email: string) {
    return Admin.findOne({ email });
  }

  async findAdminById(id: string) {
    return Admin.findById(id);
  }

  async updateAdmin(id: string, updateData: Partial<IAdmin>) {
    return Admin.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteAdmin(id: string) {
    return Admin.findByIdAndDelete(id);
  }

  async createInstructor(data: any) {
    const password = data?.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : undefined;

    return Admin.create({
      ...data,
      password,
    });
  }

  async updateRefreshToken(adminId: string, refreshToken: string) {
    return Admin.findByIdAndUpdate(
      adminId,
      { refreshToken },
      { runValidators: true, new: true }
    );
  }

  async clearRefreshToken(adminId: string) {
    return Admin.findByIdAndUpdate(
      adminId,
      { $unset: { refreshToken: "" } },
      { runValidators: true }
    );
  }

  async validatePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }

  generateAuthTokens(adminId: string) {
    return {
      accessToken: generateToken({
        id: adminId,
        type: "accessToken",
        role: "admin",
      }),
      refreshToken: generateToken({
        id: adminId,
        type: "refreshToken",
        role: "admin",
      }),
    };
  }

  async grantPermissions(adminId: string, permissions: string[]) {
    return Admin.findByIdAndUpdate(
      adminId,
      { $addToSet: { permissions: { $each: permissions } } },
      { new: true }
    );
  }

  async revokePermissions(adminId: string, permissions: string[]) {
    return Admin.findByIdAndUpdate(
      adminId,
      { $pull: { permissions: { $in: permissions } } },
      { new: true }
    );
  }
}

export const adminService = new AdminService();
