import { procedure, protectedProcedure, router } from "../trpc.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import { CACHE, wildcardDeleteCache } from "../utils/nodeCache.js";
import studentModel, { IStudent } from "../models/studentModel.js";
import { TRPCError } from "@trpc/server";
import { FilterQuery, isValidObjectId } from "mongoose";
import adminModel from "../models/adminModel.js";
import { studentAuthService } from "../services/studentAuth.js";
import { generatePassword } from "../utils/genPassword.js";
import coursesModel from "../models/coursesModel.js";
import instructorModel from "../models/instructorModel.js";
import { sendMailToEmail } from "../services/sendMailToEmail.js";
import { enrollMail } from "../constants/emrollmentMailTemplate.js";
import { frontEndLoginLink } from "../utils/feLoginLink.js";
import {
  ENROLL_EMAIL_SUBJECT,
  ENROLL_EMAIL_TEXT,
} from "../constants/messages.js";
import { uploadImageIfNeeded } from "../utils/imageUploader.js";
import { PasswordUpdateZodSchema } from "../models/passwordUpdateSchema.js";
import { SALT_ROUNDS } from "../constants/auth.js";

// Define a summary type for students by omitting sensitive fields.
type IStudentSummary = Omit<
  IStudent,
  | "password"
  | "refreshToken"
  | "emailVerificationExpires"
  | "emailVerificationToken"
  | "passwordUpdateToken"
  | "passwordUpdateTokenExpiry"
>;

interface IStudentListResponse {
  students: IStudentSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Schema for editable student fields.
const StudentEditableSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender selected is not valid" }),
  }),
  email: z.string().email(),
  username: z.string(),
  picture: z.string(),
});

const StudentUpdateZodSchema = z.object({
  data: StudentEditableSchema.partial(),
  id: z.string().refine(isValidObjectId, { message: "Invalid Student ID" }),
});

// Schema for querying a paginated list of students.
const GetStudentsZodSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  sortBy: z.enum(["isVerified", "fullName", "email"]).default("fullName"),
  order: z.enum(["asc", "desc"]).default("asc"),
  instructor: z
    .string()
    .refine(isValidObjectId, { message: "invaild instructor id" })
    .optional(),
  course: z
    .string()
    .refine(isValidObjectId, { message: "invaild instructor id" })
    .optional(),
});

export const StudentEnrollSchema = z.object({
  email: z.string().email("Enter a valud email for student"),
  fullName: z.string({ message: "Student's fullname is required" }),
  gender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Invalid gender selection" }),
    })
    .default("other"),
});

const EnrollStudentsToCourseSchema = z.object({
  studentIds: z
    .array(
      z.string().refine(isValidObjectId, {
        message: "Each student ID must be a valid ObjectId",
      })
    )
    .min(1, { message: "You must supply at least one student ID" }),
  courseId: z
    .string()
    .refine(isValidObjectId, { message: "Course ID must be a valid ObjectId" }),
});

type TGetStudentsInput = z.infer<typeof GetStudentsZodSchema>;

// Helper to build a cache key for student lists.
const getCacheKey = (input: TGetStudentsInput) => {
  const { page, limit, search, sortBy, order, instructor, course } = input;
  return `students-${page}-${limit}-${search}-${sortBy}-${order}-${instructor}-${course}`;
};

export const studentRouter = router({
  enrollToCourse: protectedProcedure
    .input(EnrollStudentsToCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: adminId, role } = ctx.user;
      const { courseId, studentIds } = input;

      const isAdmin =
        role === "admin" && (await adminModel.exists({ _id: adminId }));
      if (!isAdmin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins can enroll students on a course",
        });
      }

      const course = await coursesModel.findById(courseId);
      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Course with id ${courseId} was not found`,
        });
      }

      const toEnroll = await studentModel
        .find({
          _id: { $in: studentIds },
          enrolledCourses: { $ne: course._id },
        })
        .select("_id");

      if (toEnroll.length === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "All selected students are already enrolled in this course",
        });
      }

      const toEnrollIds = toEnroll.map((s) => s._id);

      await studentModel.updateMany(
        { _id: { $in: toEnrollIds } },
        {
          $addToSet: {
            enrolledCourses: course._id,
            instructors: course.instructor,
          },
        }
      );

      await coursesModel.findByIdAndUpdate(
        course._id,
        { $addToSet: { students: { $each: toEnrollIds } } },
        { new: true, runValidators: true }
      );

      await instructorModel.findByIdAndUpdate(
        course.instructor,
        { $addToSet: { students: { $each: toEnrollIds } } },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        newlyEnrolledCount: toEnrollIds.length,
        courseId,
        studentIds: toEnrollIds,
      };
    }),

  enroll: protectedProcedure
    .input(StudentEnrollSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: adminId, role } = ctx.user;

      try {
        const adminExists = await adminModel.exists({ _id: adminId });

        if (!adminExists || role !== "admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can enroll students",
          });
        }

        const studentExists = await studentAuthService.findStudentByEmail(
          input.email
        );

        if (studentExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Student with email ${input.email} has already been registered`,
          });
        }

        const studentPassword = generatePassword(8);
        console.log(studentPassword);

        const studentEnrollmentData = {
          ...input,
          googleSignIn: false,
          password: studentPassword,
        };

        const student = await studentAuthService.createStudent(
          studentEnrollmentData
        );

        const studentEmail = student.email;
        const studentLoginLink = frontEndLoginLink("student");

        wildcardDeleteCache("students-");
        wildcardDeleteCache("instructors-");

        // send mail to student containing password and email

        await sendMailToEmail({
          toEmail: studentEmail,
          html: enrollMail({
            email: studentEmail,
            link: studentLoginLink,
            password: studentPassword,
            role: "student",
            username: student.fullName,
          }),
          message: ENROLL_EMAIL_TEXT(
            studentLoginLink,
            studentEmail,
            studentPassword
          ),
          subject: ENROLL_EMAIL_SUBJECT,
        });

        return { success: true, student };
      } catch (error) {
        console.error("An Error occured while trying to enroll student");
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occured",
        });
      }
    }),

  getAll: protectedProcedure
    .input(GetStudentsZodSchema)
    .query(async ({ input }) => {
      const cacheKey = getCacheKey(input);
      const cachedData = CACHE.get<IStudentListResponse>(cacheKey);
      if (cachedData) {
        console.log(`[CACHE] Hit for ${cacheKey}`);
        return cachedData;
      }
      console.log(`[CACHE] Miss for ${cacheKey}`);

      const { page, limit, search, sortBy, order, instructor, course } = input;
      const skip = (page - 1) * limit;
      const sortOrder = order === "asc" ? 1 : -1;

      const searchQuery: FilterQuery<IStudentSummary> = {};

      if (instructor) {
        searchQuery.instructors = { $in: [instructor] };
      }

      if (course) {
        searchQuery.enrolledCourses = { $ne: [course] };
      }

      if (search) {
        const pattern = new RegExp(search, "i");
        searchQuery.$or = [
          { fullName: pattern },
          { email: pattern },
          { username: pattern },
        ];
      }

      const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      try {
        const [students, total] = await Promise.all([
          studentModel
            .find(searchQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .select(
              "-password -refreshToken -emailVerificationExpires -emailVerificationToken -passwordUpdateToken -passwordUpdateTokenExpiry"
            )
            .lean(),
          studentModel.countDocuments(searchQuery),
        ]);

        const response: IStudentListResponse = {
          students,
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
        console.error(`[ERROR] Fetching students failed:`, error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch students",
        });
      }
    }),

  // Get a single student by ID.
  getById: procedure
    .input(
      z.object({
        id: z
          .string()
          .refine(isValidObjectId, { message: "Invalid student ID" }),
      })
    )
    .query(async ({ input }) => {
      const { id: studentId } = input;
      const cacheKey = `student-${studentId}`;
      const cachedData = CACHE.get<IStudentSummary>(cacheKey);
      if (cachedData) {
        console.log(`[CACHE] Hit for ${cacheKey}`);
        return cachedData;
      }
      console.log(`[CACHE] Miss for ${cacheKey}`);

      try {
        const student = await studentModel
          .findById(studentId)
          .select(
            "-password -refreshToken -emailVerificationExpires -emailVerificationToken -passwordUpdateToken -passwordUpdateTokenExpiry"
          )
          .lean();

        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Student with id ${studentId} was not found`,
          });
        }

        CACHE.set(cacheKey, student);
        console.log(`[CACHE] Set for ${cacheKey}`);
        return student;
      } catch (error) {
        console.error(`[ERROR] Fetching student failed:`, error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong, please try again later",
        });
      }
    }),

  // Update a student's profile.
  update: protectedProcedure
    .input(StudentUpdateZodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: currentStudentId, role } = ctx.user;
      const { data, id: studentId } = input;

      const imageUrl = await uploadImageIfNeeded(data.picture);

      try {
        // Ensure the student exists.
        const studentExists = await studentModel.exists({ _id: studentId });

        if (!studentExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Student with id ${studentId} does not exist`,
          });
        }

        const filterQuery: FilterQuery<IStudent> = {
          $and: [
            { _id: studentId },
            ...(role !== "admin" ? [{ _id: currentStudentId }] : []),
          ],
        };

        const uploadPayload = {
          ...data,
          ...(imageUrl && { picture: imageUrl }),
        };

        const updatedStudent = await studentModel.findOneAndUpdate(
          filterQuery,
          uploadPayload,
          {
            new: true,
            runValidators: true,
          }
        );

        if (!updatedStudent) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this student",
          });
        }

        // Invalidate cache entries related to this student.
        CACHE.del(`student-${studentId}`);
        wildcardDeleteCache("students-");

        return updatedStudent;
      } catch (err) {
        console.error(`[ERROR] Updating student failed:`, err);
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
      const { id: studentId } = ctx.user;
      const { currentPassword, newPassword } = input;

      try {
        const student = await studentModel.findById(studentId);
        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student user not found",
          });
        }

        const isPasswordMatch = await bcrypt.compare(
          currentPassword,
          student.password!
        );

        if (!isPasswordMatch) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect credentials",
          });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        student.password = newHashedPassword;

        await student.save();

        return { success: true };
      } catch (error) {
        console.error(
          "An error occured while trying to update student password: ",
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
