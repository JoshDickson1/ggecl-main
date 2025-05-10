import { procedure, protectedProcedure, router } from "../trpc.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import { CACHE, wildcardDeleteCache } from "../utils/nodeCache.js";
import instructorModel, { IInstructor } from "../models/instructorModel.js";
import { TRPCError } from "@trpc/server";
import { FilterQuery, isValidObjectId } from "mongoose";
import { CACHE_PREFIX as CartItemsCachePrefix } from "./cartRouter.js";
import { instructorAuthService } from "../services/instructorAuth.js";
import adminModel from "../models/adminModel.js";
import { generatePassword } from "../utils/genPassword.js";
import { frontEndLoginLink } from "../utils/feLoginLink.js";
import { sendMailToEmail } from "../services/sendMailToEmail.js";
import { enrollMail } from "../constants/emrollmentMailTemplate.js";
import {
  ENROLL_EMAIL_SUBJECT,
  ENROLL_EMAIL_TEXT,
} from "../constants/messages.js";
import { SALT_ROUNDS } from "../constants/auth.js";
import { PasswordUpdateZodSchema } from "../models/passwordUpdateSchema.js";
import { uploadImageIfNeeded } from "../utils/imageUploader.js";

// Define the instructor summary type by omitting sensitive fields.
type IInstructorSummary = Omit<
  IInstructor,
  | "password"
  | "refreshToken"
  | "emailVerificationExpires"
  | "emailVerificationToken"
  | "passwordUpdateToken"
  | "passwordUpdateTokenExpiry"
>;

interface IInstructorListResponse {
  instructors: IInstructorSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Schema for fields that can be edited.
const InstructorEditableSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  picture: z.string(),
  bio: z.string().min(5, "Bio must be at least 5 characters"),
  topics: z.array(z.string()),
});

// Schema for updating an instructor.
const InstructorUpdateSchema = z.object({
  data: InstructorEditableSchema.partial(),
  id: z.string().refine(isValidObjectId, { message: "Invalid instructor ID" }),
});

// Schema for querying instructors with pagination, search, and sorting.
const GetInstructorsZodSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  sortBy: z
    .enum(["isVerified", "fullName", "email", "schRole"])
    .default("isVerified"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

const InstructorRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  gender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Invalid gender selection" }),
    })
    .default("other"),
  picture: z.string().url("Invalid URL format").optional(),
});

const GetInstructorByIdZodSchema = z.object({
  id: z.string().refine(isValidObjectId, { message: "Invalid instructor ID" }),
});

type TGetInstructorsInput = z.infer<typeof GetInstructorsZodSchema>;

// Helper to generate cache key for instructor list.
const getCacheKey = (prefix: string, input: TGetInstructorsInput) => {
  const { page, limit, search, sortBy, order } = input;
  return `${prefix}-${page}-${limit}-${search}-${sortBy}-${order}`;
};

export const instructorRouter = router({
  enroll: protectedProcedure
    .input(InstructorRegistrationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: instructorId, role } = ctx.user;

      try {
        const adminExists = await adminModel.exists({ _id: instructorId });

        if (!adminExists || role !== "admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can enroll instructors",
          });
        }

        const instructorExists =
          await instructorAuthService.findInstructorByEmail(input.email);

        if (instructorExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Instructor with email ${input.email} has already been registered`,
          });
        }

        const instructorPassword = generatePassword(8);
        console.log(instructorPassword);

        const instructorEnrollmentData = {
          ...input,
          googleSignIn: false,
          password: instructorPassword,
        };

        const instructor = await instructorAuthService.createInstructor(
          instructorEnrollmentData
        );

        const instructorEmail = instructor.email;
        const instructorLoginLink = frontEndLoginLink("instructor");

        wildcardDeleteCache("students-");
        wildcardDeleteCache("instructors-");

        await sendMailToEmail({
          toEmail: instructorEmail,
          html: enrollMail({
            email: instructorEmail,
            link: instructorLoginLink,
            password: instructorPassword,
            role: "instructor",
            username: instructor.fullName,
          }),
          message: ENROLL_EMAIL_TEXT(
            instructorLoginLink,
            instructorEmail,
            instructorPassword
          ),
          subject: ENROLL_EMAIL_SUBJECT,
        });

        return { success: true, instructor };
      } catch (error) {
        console.error("An Error occured while trying to enroll instructor");
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occured",
        });
      }
    }),

  // Get a paginated list of instructors with optional search and sorting.
  getAll: procedure.input(GetInstructorsZodSchema).query(async ({ input }) => {
    const cacheKey = getCacheKey("instructors", input);
    const cachedData = CACHE.get<IInstructorListResponse>(cacheKey);
    if (cachedData) {
      console.log(`[CACHE] Hit for ${cacheKey}`);
      return cachedData;
    }
    console.log(`[CACHE] Miss for ${cacheKey}`);

    const { page, limit, search, sortBy, order } = input;
    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    const searchQuery: FilterQuery<IInstructorSummary> = {};

    if (search) {
      const pattern = new RegExp(search, "i");
      searchQuery.$or = [
        { fullName: pattern },
        { email: pattern },
        { username: pattern },
        { schRole: pattern },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    try {
      const [instructors, total] = await Promise.all([
        instructorModel
          .find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .select(
            "-password -refreshToken -emailVerificationExpires -emailVerificationToken -passwordUpdateToken -passwordUpdateTokenExpiry"
          )
          .populate<{
            courses: { _id: string; title: string; image: string }[];
          }>("courses", "title image")
          .populate<{ students: { name: string; email: string }[] }>(
            "students",
            "name email"
          )
          .lean(),
        instructorModel.countDocuments(searchQuery),
      ]);

      const response = {
        instructors,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      CACHE.set(cacheKey, response);
      console.log(`[CACHE] Set for ${cacheKey}`);

      return response;
    } catch (error) {
      console.error("[ERROR] Fetching instructors failed:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch instructors",
      });
    }
  }),

  // Get a single instructor by ID.
  getById: procedure
    .input(GetInstructorByIdZodSchema)
    .query(async ({ input }) => {
      const { id: instructorId } = input;
      const cacheKey = `instructor-${instructorId}`;

      const cachedData = CACHE.get<IInstructorSummary>(cacheKey);
      if (cachedData) {
        console.log(`[CACHE] Hit for ${cacheKey}`);
        return cachedData;
      }
      console.log(`[CACHE] Miss for ${cacheKey}`);

      try {
        const instructor = await instructorModel
          .findById(instructorId)
          .select(
            "-password -refreshToken -emailVerificationExpires -emailVerificationToken -passwordUpdateToken -passwordUpdateTokenExpiry"
          )
          .populate<{
            courses: { _id: string; title: string; image: string }[];
          }>("courses", "title image")
          .populate<{ students: { name: string; email: string }[] }>(
            "students",
            "name email"
          )
          .lean()
          .exec();

        if (!instructor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Instructor with id ${instructorId} was not found`,
          });
        }

        CACHE.set(cacheKey, instructor);
        console.log(`[CACHE] Set for ${cacheKey}`);

        return instructor;
      } catch (error) {
        console.error("[ERROR] Fetching instructor failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  // Update an instructor's information.
  update: protectedProcedure
    .input(InstructorUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { role, id: currentUserId } = ctx.user;
      const { data, id: instructorId } = input;

      const imageUrl = await uploadImageIfNeeded(data.picture);

      try {
        const instructorExists = await instructorModel.exists({
          _id: instructorId,
        });

        if (!instructorExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Instructor with id ${instructorId} does not exist`,
          });
        }

        const filterQuery: FilterQuery<IInstructor> = {
          $and: [
            { _id: instructorId },
            ...(role !== "admin" ? [{ _id: currentUserId }] : []),
          ],
        };

        const updatePayload = {
          ...data,
          ...(imageUrl && { picture: imageUrl }),
        };

        const updatedInstructor = await instructorModel.findOneAndUpdate(
          filterQuery,
          updatePayload,
          {
            new: true,
            runValidators: true,
          }
        );

        if (!updatedInstructor) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this instructor",
          });
        }

        // Invalidate related cache entries.
        CACHE.del(`instructor-${instructorId}`);
        wildcardDeleteCache("instructors-");
        wildcardDeleteCache(`${CartItemsCachePrefix}:`);

        return updatedInstructor;
      } catch (err) {
        console.error("[ERROR] Updating instructor failed:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        });
      }
    }),

  updatePasswordWithOld: protectedProcedure
    .input(PasswordUpdateZodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: instructorId, role } = ctx.user;
      const { currentPassword, newPassword } = input;

      if (role !== "instructor") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Insufficent permission",
        });
      }

      try {
        const instructor = await instructorModel.findById(instructorId);
        if (!instructor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Instructor user not found",
          });
        }

        const isPasswordMatch = await bcrypt.compare(
          currentPassword,
          instructor.password!
        );

        if (!isPasswordMatch) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect credentials",
          });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        instructor.password = newHashedPassword;

        await instructor.save();

        return { success: true };
      } catch (error) {
        console.error(
          "An error occured while trying to update instructor password: ",
          error instanceof Error ? error.message : error
        );

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update password",
        });
      }
    }),
});
