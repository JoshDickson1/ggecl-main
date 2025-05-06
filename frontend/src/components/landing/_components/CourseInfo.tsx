import { useState, useMemo } from "react";
import { FaAward, FaGraduationCap, FaPlay, FaStar } from "react-icons/fa";
import SyllabusAccordion from "./SyllabusAccordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateInitials } from "@/lib/generateInitial";
import { GetCourseOutput } from "@/utils/trpc";
import { formatDate } from "date-fns";
import { TInstructor } from "@/types/instructorType";

const tabs = ["All", "Description", "Instructor", "Syllabus", "Reviews"];

const CourseInfo: React.FC<{ course: GetCourseOutput }> = ({ course }) => {
  const [activeTab, setActiveTab] = useState<string>("All");

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "All":
        return (
          <>
            <CourseDescription description={course.description} />
            <InstructorInfo instructor={course.instructor} />
            <SyllabusAccordion />
            <StudentReviews reviews={course.reviews} />
          </>
        );
      case "Description":
        return <CourseDescription description={course.description} />;
      case "Instructor":
        return <InstructorInfo instructor={course.instructor} />;
      case "Syllabus":
        return <SyllabusAccordion />;
      case "Reviews":
        return <StudentReviews reviews={course.reviews} />;
      default:
        return null;
    }
  }, [activeTab, course]);

  return (
    <article className="mx-auto w-full bg-white p-4 md:p-6 dark:bg-gray-900">
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <Separator className="my-4 w-full md:w-[65%]" />
      <div className="mt-2">{renderTabContent}</div>
    </article>
  );
};

const TabNavigation: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ activeTab, setActiveTab }) => (
  <div className="flex w-full gap-4 overflow-x-auto md:w-[65%]">
    {tabs.map((tab) => (
      <Button
        variant={"ghost"}
        key={tab}
        className={`border-gray-200/40 text-sm transition duration-100 dark:border-blue-300/20 dark:hover:bg-gray-800 ${
          activeTab === tab
            ? "border-transparent bg-[#eff6ff] font-semibold dark:bg-gray-800"
            : "border text-gray-500 dark:text-gray-400"
        }`}
        onClick={() => setActiveTab(tab)}
      >
        {tab}
      </Button>
    ))}
  </div>
);

// Course Description
const CourseDescription: React.FC<{ description: string }> = ({
  description,
}) => (
  <section>
    <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
      Course Description
    </h2>
    <p className="w-full leading-7 text-gray-700 md:w-[65%] dark:text-gray-300">
      {description}
    </p>
    <Separator className="my-6 w-full md:w-[65%]" />
  </section>
);

// Instructor Information
const InstructorInfo: React.FC<{
  instructor: GetCourseOutput["instructor"];
}> = ({ instructor }) => {
  const fmtInstructor = instructor as TInstructor;

  return (
    <section>
      <h2 className="my-3 text-xl font-bold text-gray-800 dark:text-gray-200">
        Instructor
      </h2>
      <div className="my-2">
        <h3 className="font-bold text-blue-500">{fmtInstructor.fullName}</h3>
        <span className="text-sm font-semibold text-gray-500">
          {fmtInstructor.schRole}
        </span>
      </div>
      <div className="my-5 flex items-center gap-6">
        <img
          src={fmtInstructor.picture}
          className="h-24 w-24 rounded-full object-cover"
          alt={fmtInstructor.fullName}
        />
        <div className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FaAward /> {fmtInstructor.reviews.length} Reviews
          </p>
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FaGraduationCap /> {fmtInstructor.students.length} Students
          </p>
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FaPlay /> {fmtInstructor.courses.length} Courses
          </p>
        </div>
      </div>
      <p className="mt-6 w-full leading-7 text-gray-700 md:w-[65%] dark:text-gray-300">
        {fmtInstructor.bio}
      </p>
      <Separator className="my-7 w-full md:w-[65%]" />
    </section>
  );
};

const StudentReviews: React.FC<{
  reviews: GetCourseOutput["reviews"];
}> = ({ reviews }) => {
  return (
    <section className="my-4 flex flex-col md:flex-row md:gap-16">
      <header>
        <h2 className="mb-5 text-xl font-bold text-gray-800 dark:text-gray-200">
          Learner Reviews
        </h2>

        {/* Total stars and reviews  */}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center">
            <span className="mr-2 text-4xl font-bold">4.6</span>
            <div className="mr-4 flex items-center">
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
              <FaStar className="text-yellow-400" />
              <FaStar className="text-gray-300" />
            </div>
            <span className="text-sm text-gray-500">
              ({reviews.length} reviews)
            </span>
          </div>
        </div>

        {/* Star levels */}
        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <div className="flex-1 space-y-2">
            {/* 5 Star */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                5 <FaStar className="text-yellow-400" />
              </span>
              <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: "80%" }}
                />
              </div>
              <span className="text-sm text-gray-600">80%</span>
            </div>
            {/* 4 Star */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                4 <FaStar className="text-yellow-400" />
              </span>
              <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: "10%" }}
                />
              </div>
              <span className="text-sm text-gray-600">10%</span>
            </div>
            {/* 3 Star */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                3 <FaStar className="text-yellow-400" />
              </span>
              <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: "7%" }}
                />
              </div>
              <span className="text-sm text-gray-600">7%</span>
            </div>
            {/* 2 Star */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                2 <FaStar className="text-yellow-400" />
              </span>
              <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: "2%" }}
                />
              </div>
              <span className="text-sm text-gray-600">2%</span>
            </div>
            {/* 1 Star */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                1 <FaStar className="text-yellow-400" />
              </span>
              <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: "1%" }}
                />
              </div>
              <span className="text-sm text-gray-600">1%</span>
            </div>
          </div>
        </div>
      </header>

      {/* student Reviews */}
      <div className="mt-6 space-y-6">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="flex flex-col gap-6 rounded-md border p-5 md:flex-row dark:border-blue-300/30"
          >
            <div className="flex gap-4">
              <Avatar className="object-cover">
                <AvatarImage src={review.image} />
                <AvatarFallback>
                  {generateInitials(review.reviewer)}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold">{review.reviewer}</p>
            </div>

            <div className="flex max-w-[30rem] flex-col gap-3">
              <div className="flex items-center gap-1">
                {/* 5 Stars */}
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <span className="ml-4 text-sm text-gray-500">
                  Reviewed on {formatDate(review.date, "MMM d, yyyy")}
                </span>
              </div>
              <p className="leading-7 text-gray-700 dark:text-gray-300">
                {review.comment}
              </p>
            </div>
          </div>
        ))}

        <div className="mt-6">
          <Button
            variant={"outline"}
            className="bg-transparent font-semibold dark:hover:bg-gray-800"
          >
            View more Reviews
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CourseInfo;
