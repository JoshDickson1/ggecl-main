import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEnrollInstructor } from "../hooks/useEnrollInstructor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useInstructors } from "@/hooks/useInstructors";

// Define the registration schema with Zod validation
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

type InstructorRegistrationForm = z.infer<typeof InstructorRegistrationSchema>;

const InstructorInfo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { debouncedValue } = useDebounce(searchTerm);

  const { enrollInstructor, isEnrolling } = useEnrollInstructor();

  const { loading, meta, instructors } = useInstructors({
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedValue,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = meta?.totalPages ?? 1;

  const changePage = useCallback(
    (dir: "prev" | "next") => {
      setCurrentPage((p) =>
        dir === "prev" ? Math.max(1, p - 1) : Math.min(totalPages, p + 1),
      );
    },
    [totalPages],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstructorRegistrationForm>({
    resolver: zodResolver(InstructorRegistrationSchema),
  });

  // Handler for adding a Instructor
  const onSubmit = (data: InstructorRegistrationForm) => {
    console.log("New Instructor Data:", data);
    enrollInstructor(data);
    setTimeout(() => {
      reset();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white p-4 dark:bg-gray-900">
      <div className="mb-5 space-y-0.5">
        <h1 className="text-3xl font-bold md:text-4xl">Instructor Management</h1>
        <p className="text-muted-foreground text-sm">
          veiw and manage instructors who teach at your school
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {/* Add Instructor Section */}
        <div className="mt-5 w-full rounded-lg border p-4 shadow md:max-w-xl dark:bg-gray-900">
          <h1 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
            Add Instructor
          </h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-4 gap-4"
          >
            {/* Full Name Field */}
            <div className="col-span-2">
              <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Label>
              <Input
                type="text"
                {...register("fullName")}
                className="w-full rounded-md border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            {/* Email Field */}
            <div className="col-span-2">
              <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                type="email"
                {...register("email")}
                className="w-full rounded-md border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            {/* Gender Field */}
            <div className="col-span-4">
              <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </Label>
              <select
                {...register("gender")}
                className="w-full rounded-md border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.gender.message}
                </p>
              )}
            </div>
            <Button disabled={isEnrolling} type="submit" className="w-fit px-5">
              {isEnrolling ? "Adding..." : " Add Instructor"}
            </Button>
          </form>
        </div>

        {/* Instructor List Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
            Instructor List
          </h2>
          {/* Search Field */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              type="text"
              placeholder="Search by full name"
              className="w-full rounded-md border border-gray-300 px-4 py-2 md:w-1/3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <input type="checkbox" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Instructor Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center italic">
                      Loading...
                    </td>
                  </tr>
                ) : instructors.length > 0 ? (
                  instructors.map((instructor) => (
                    <tr
                      key={instructor.email}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {instructor.fullName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {instructor.email}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                        <button
                          // onClick={ (instructor.email)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-gray-500 italic"
                    >
                      No instructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Show rows:
              <select
                className="ml-2 rounded-md border px-2 py-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <button
                onClick={() => changePage("prev")}
                className={`rounded border px-2 py-1 dark:border-gray-600 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => changePage("next")}
                className={`rounded border px-2 py-1 dark:border-gray-600 ${
                  currentPage === totalPages || totalPages === 0
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorInfo;
