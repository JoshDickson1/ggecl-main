import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { SkeletonTheme } from "react-loading-skeleton";
import NotFound from "@/components/ui/NotFound.tsx";
import AuthPageLoading from "@/components/auth/_components/AuthPageLoading.tsx";

// === Landing Page Components (Eagerly Loaded) ===
import Layout from "@/components/landing/Layout";
import Home from "@/components/landing/pages/Home";

const Cart = lazy(() => import("@/components/landing/pages/Cart"));
const Login = lazy(() => import("@/components/auth/pages/Login"));
const Instructor = lazy(() => import("@/components/landing/pages/Instructor"));
const Courses = lazy(() => import("@/components/landing/pages/Courses"));
const CoursePage = lazy(() => import("@/components/landing/pages/CoursePage"));

// === Lazy Loaded Auth Components (Less Frequently Visited) ===
const InstructorLogin = lazy(
  () => import("@/components/auth/pages/InstructorLogin.tsx"),
);
const Adminlogin = lazy(() => import("@/components/auth/pages/AdminLogin"));

const VerifyEmail = lazy(() => import("@/components/utils/VerifyEmail"));

// === Lazy Loaded dashboard Components ===
const StudentLayout = lazy(
  () => import("@/components/dashboard/students/_components/StudentLayout.tsx"),
);
const InstructorLayout = lazy(
  () =>
    import(
      "@/components/dashboard/instructor/_components/InstructorLayout.tsx"
    ),
);
const AdminLayout = lazy(
  () => import("@/components/dashboard/admin/components/AdminLayout.tsx"),
);

// --- Student dashboard Pages ---
const StudentHome = lazy(
  () => import("@/components/dashboard/students/pages/StudentHome.tsx"),
);
const StudentSupport = lazy(
  () => import("@/components/dashboard/students/pages/StudentSupport.tsx"),
);
const StudentForgot = lazy(
  () => import("@/components/dashboard/students/pages/StudentForgot.tsx"),
);
const StudentUpdate = lazy(
  () => import("@/components/dashboard/students/pages/StudentUpdate.tsx"),
);
const Assignment = lazy(
  () => import("@/components/dashboard/students/pages/Assignment.tsx"),
);
const Settings = lazy(
  () => import("@/components/dashboard/students/pages/Settings.tsx"),
);
const StudentCourses = lazy(
  () => import("@/components/dashboard/students/pages/StudentCourses.tsx"),
);
const StudentCalendar = lazy(
  () => import("@/components/dashboard/students/pages/StudentCalendar.tsx"),
);
const StudentChat = lazy(
  () => import("@/components/dashboard/students/pages/StudentChat.tsx"),
);
const Video = lazy(
  () => import("@/components/dashboard/students/pages/Video.tsx"),
);

// --- Instructor dashboard Pages ---
const InstructorHome = lazy(
  () => import("@/components/dashboard/instructor/pages/InstructorHome.tsx"),
);

const InstructorSettings = lazy(
  () =>
    import("@/components/dashboard/instructor/pages/InstructorSettings.tsx"),
);
const StudentList = lazy(
  () => import("@/components/dashboard/instructor/pages/StudentList.tsx"),
);
const CoursesDetails = lazy(
  () => import("@/components/dashboard/instructor/pages/CoursesDetails.tsx"),
);
const Earnings = lazy(
  () => import("@/components/dashboard/instructor/pages/Earnings.tsx"),
);
const InstructorCourses = lazy(
  () => import("@/components/dashboard/instructor/pages/InstructorCourses.tsx"),
);
const SingleCourse = lazy(
  () => import("@/components/dashboard/instructor/pages/SingleCourse.tsx"),
);
const Chat = lazy(
  () => import("@/components/dashboard/instructor/pages/Chat.tsx"),
);
const IsCalendar = lazy(
  () => import("@/components/dashboard/instructor/pages/IsCalendar.tsx"),
);
const AssignmentCheck = lazy(
  () => import("@/components/dashboard/instructor/pages/AssignmentCheck.tsx"),
);

const InstructorForgot = lazy(
  () => import("@/components/dashboard/instructor/pages/InstructorForgot.tsx"),
);
const InstructorUpdate = lazy(
  () => import("@/components/dashboard/instructor/pages/InstructorUpdate.tsx"),
);

const Support = lazy(
  () => import("@/components/dashboard/instructor/pages/Support.tsx"),
);

const VideoCall = lazy(
  () => import("@/components/dashboard/instructor/pages/VideoCall.tsx"),
);

// --- Admin dashboard Pages ---
const AdminHome = lazy(
  () => import("@/components/dashboard/admin/pages/AdminHome.tsx"),
);

const AdminSettings = lazy(
  () => import("@/components/dashboard/admin/pages/AdminSettings.tsx"),
);

const AdminEditCourse = lazy(
  () => import("@/components/dashboard/admin/pages/EditCourse.tsx"),
);
const AdminChat = lazy(
  () => import("@/components/dashboard/admin/pages/AdminChat.tsx"),
);
const CourseManagement = lazy(
  () => import("@/components/dashboard/admin/pages/CourseManagement.tsx"),
);
const Analytics = lazy(
  () => import("@/components/dashboard/admin/pages/Analytics.tsx"),
);
const InstructorInfo = lazy(
  () => import("@/components/dashboard/admin/pages/InstructorInfo.tsx"),
);
const StudentInfo = lazy(
  () => import("@/components/dashboard/admin/pages/StudentInfo.tsx"),
);
const AdminInfo = lazy(
  () => import("@/components/dashboard/admin/pages/AdminInfo.tsx"),
);
const Schedule = lazy(
  () => import("@/components/dashboard/admin/pages/Shedule.tsx"),
);
const AddCourseAd = lazy(
  () => import("@/components/dashboard/admin/pages/AddCourseAd.tsx"),
);

function App() {
  return (
    <SkeletonTheme baseColor="#313131" highlightColor="#525252">
      <Toaster />
      <Routes>
        {/* === Landing Page Routes === */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="cart"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Cart />
              </Suspense>
            }
          />
          <Route
            path="login"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="forgot-password"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentForgot />
              </Suspense>
            }
          />

          <Route
            path="update-password"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentUpdate />
              </Suspense>
            }
          />

          <Route
            path="instructor"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Instructor />
              </Suspense>
            }
          />
          <Route
            path="courses/:id"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <CoursePage />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Courses />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Courses />
              </Suspense>
            }
          />

          <Route
            path="verify-email"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <VerifyEmail />
              </Suspense>
            }
          />

          {/* --- Auth Routes (Lazy Loaded) --- */}
          <Route
            path="instructor/login"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorLogin />
              </Suspense>
            }
          />
          <Route
            path="instructor/forgotten-password"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorForgot />
              </Suspense>
            }
          />
          <Route
            path="instructor/update-password"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorUpdate />
              </Suspense>
            }
          />

          <Route
            path="support"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Support />
              </Suspense>
            }
          />

          <Route
            path="admin/login"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Adminlogin />
              </Suspense>
            }
          />
        </Route>

        {/* === Student Dashboard Routes (Lazy Loaded) === */}
        <Route
          path="/student/dashboard"
          element={
            <Suspense fallback={<AuthPageLoading />}>
              <StudentLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentHome />
              </Suspense>
            }
          />

          <Route
            path="support"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentSupport />
              </Suspense>
            }
          />

          <Route
            path="assignment"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Assignment />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Settings />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentCourses />
              </Suspense>
            }
          />
            <Route
              path="courses/:courseId"
              element={
                <Suspense fallback={<AuthPageLoading />}>
                  <Video />
                </Suspense>
              }
            />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentCalendar />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentChat />
              </Suspense>
            }
          />
        </Route>

        {/* === Instructor Dashboard Routes (Lazy Loaded) === */}
        <Route
          path="/instructor/dashboard"
          element={
            <Suspense fallback={<AuthPageLoading />}>
              <InstructorLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorHome />
              </Suspense>
            }
          />

          <Route
            path="support"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Support />
              </Suspense>
            }
          />
          <Route
            path="video"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <VideoCall />
              </Suspense>
            }
          />
          <Route
            path="mycourses"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <CoursesDetails />
              </Suspense>
            }
          />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <IsCalendar />
              </Suspense>
            }
          />
          <Route
            path="check-assignments"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AssignmentCheck />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorSettings />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentList />
              </Suspense>
            }
          />
          <Route
            path="earnings"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Earnings />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorCourses />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path="course1"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <SingleCourse />
              </Suspense>
            }
          />

          <Route
            path="support"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Support />
              </Suspense>
            }
          />
        </Route>

        {/* === Admin Dashboard Routes (Lazy Loaded) === */}
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<AuthPageLoading />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AdminHome />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AdminSettings />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AdminChat />
              </Suspense>
            }
          />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Schedule />
              </Suspense>
            }
          />
          <Route
            path="add-course"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AddCourseAd />
              </Suspense>
            }
          />

          <Route
            path="edit-course/:courseId"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AdminEditCourse />
              </Suspense>
            }
          />

          <Route
            path="students"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentInfo />
              </Suspense>
            }
          />
          <Route
            path="admins"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <AdminInfo />
              </Suspense>
            }
          />
          <Route
            path="instructors"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorInfo />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <CourseManagement />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="instructors"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <InstructorInfo />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense fallback={<AuthPageLoading />}>
                <StudentInfo />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </SkeletonTheme>
  );
}

export default App;
