import { FaPlayCircle, FaUserCircle } from "react-icons/fa";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  LucideUserPlus,
  LucideUserRoundPlus,
  LucideShieldPlus,
} from "lucide-react";
import { JSX, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useInstructor } from "@/hooks/useInstructor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateInitials } from "@/lib/generateInitial";
import { useIAssignments } from "../../admin/hooks/useIAssignments";

interface CtaBannerProps {
  title: string;
  description: string;
  link: string;
  icon: JSX.Element;
  colorClass: string;
}

const ctaBanners: CtaBannerProps[] = [
  {
    title: "Schedula an Assignment",
    description: "Easily onboard new learners to your platform.",
    link: "/instructor/dashboard/check-assignments",
    icon: <LucideUserPlus className="h-6 w-6 text-blue-400" />,
    colorClass:
      "border border-blue-300 dark:border-blue-900 text-blue-700 dark:text-blue-300",
  },
  {
    title: "View My Courses",
    description: "Grow your teaching team with skilled professionals.",
    link: "/instructor/dashboard/courses",
    icon: <LucideUserRoundPlus className="h-6 w-6 text-blue-500" />,
    colorClass:
      "border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300",
  },
  {
    title: "View list of Students",
    description: "Grant access to manage the platform effectively.",
    link: "/instructor/dashboard/students",
    icon: <LucideShieldPlus className="h-6 w-6 text-red-500" />,
    colorClass:
      "border border-red-100 dark:border-red-900 text-red-700 dark:text-red-300",
  },
];

const InstructorHome = () => {
  const { instructor } = useInstructor();
  const { meta } = useIAssignments({});

  const features = useMemo(
    () => [
      {
        id: 1,
        amount: instructor.courses.length,
        info: "Assigned Courses",
        icon: (
          <FaPlayCircle
            className="rounded-sm bg-blue-200 p-2 text-blue-600"
            size={40}
          />
        ),
        border: "border-blue-300 dark:border-blue-600",
      },

      {
        id: 4,
        amount: instructor.students.length,
        info: "Total Students",
        icon: (
          <FaUserCircle
            className="rounded-sm bg-orange-200 p-2 text-orange-600"
            size={40}
          />
        ),
        border: "border-orange-300 dark:border-orange-600",
      },
      {
        id: 5,
        amount: meta?.total ?? 0,
        info: "Total Assignments Given",
        icon: (
          <FaUserCircle
            className="rounded-sm bg-purple-200 p-2 text-purple-600"
            size={40}
          />
        ),
        border: "border-purple-300 dark:border-purple-600",
      },
    ],
    [],
  );

  return (
    <div className="bg-gray-50 p-6 transition-all dark:bg-gray-900">
      {/* Stats Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Hello, {instructor.fullName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          At‑a‑glance view of your courses, student engagement, and teaching
          tools.
        </p>
      </header>

      <div>
        {/* First Row */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {features.slice(0, 3).map((feature) => (
            <div
              key={feature.id}
              className={`flex flex-row items-center gap-4 border shadow-md ${feature.border} rounded-md p-3`}
            >
              {feature.icon}
              <div className="whitespace-normal text-gray-700 dark:text-gray-300">
                <p className="text-xl">{feature.amount}</p>
                <p className="text-sm">{feature.info}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Second Row */}
        <div className="mt-4 grid grid-cols-1 gap-4 whitespace-normal sm:grid-cols-2 md:grid-cols-5">
          {features.slice(3, 6).map((feature) => (
            <div
              key={feature.id}
              className={`flex flex-row items-center gap-4 border shadow-md ${feature.border} rounded-md p-3 whitespace-normal`}
            >
              {feature.icon}
              <div className="whitespace-normal text-gray-700 dark:text-gray-300">
                <p className="text-xl">{feature.amount}</p>
                <p className="text-sm">{feature.info}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Section */}
      <div className="mx-auto my-10 flex min-h-32 w-full flex-col items-center justify-start gap-6 rounded-md bg-gray-800 px-6 py-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 object-cover">
            <AvatarImage src={instructor.picture} />
            <AvatarFallback>
              {generateInitials(instructor.fullName)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold text-white">{instructor.fullName}</p>
            <p className="text-sm text-gray-400">{instructor.email}</p>
          </div>
        </div>

        <Link to="/instructor/dashboard/settings">
          <Button variant={"secondary"}>Edit Bio</Button>
        </Link>
      </div>

      {/* CTA Banners */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ctaBanners.map((banner) => (
          <motion.div
            key={banner.title}
            className={`rounded-lg p-6 shadow-md ${banner.colorClass} dark:border dark:border-gray-700`}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.1 }}
          >
            <div className="mb-4 flex items-center">
              {banner.icon}
              <h3 className="ml-2 text-lg font-semibold dark:text-gray-100">
                {banner.title}
              </h3>
            </div>
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              {banner.description}
            </p>
            <Link to={banner.link}>
              <Button variant={"secondary"}>{banner.title}</Button>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
};

export default InstructorHome;
