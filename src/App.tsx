import { getAuthSession, getDashboardPathForUser } from "@/lib/auth";
import type { PortalType } from "@/lib/validations/login-schema";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/home/home-page"));
const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard-page").then((module) => ({ default: module.AdminDashboardPage })));
const AdminAdminsPage = lazy(() => import("@/pages/admin/admins-page").then((module) => ({ default: module.AdminAdminsPage })));
const AdminClassesPage = lazy(() => import("@/pages/admin/classes-page").then((module) => ({ default: module.AdminClassesPage })));
const AdminStudentsPage = lazy(() => import("@/pages/admin/students-page").then((module) => ({ default: module.AdminStudentsPage })));
const AdminSubjectsPage = lazy(() => import("@/pages/admin/subjects-page").then((module) => ({ default: module.AdminSubjectsPage })));
const AdminTeachersPage = lazy(() => import("@/pages/admin/teachers-page").then((module) => ({ default: module.AdminTeachersPage })));
const AdminUsersPage = lazy(() => import("@/pages/admin/users-page").then((module) => ({ default: module.AdminUsersPage })));
const AdminPlaceholderPage = lazy(() => import("@/pages/admin/placeholder-page").then((module) => ({ default: module.AdminPlaceholderPage })));
const BKDashboardPage = lazy(() => import("@/pages/bk/dashboard-page").then((module) => ({ default: module.BKDashboardPage })));
const BKAttendancePage = lazy(() => import("@/pages/bk/attendance-page").then((module) => ({ default: module.BKAttendancePage })));
const BKCounselingPage = lazy(() => import("@/pages/bk/counseling-page").then((module) => ({ default: module.BKCounselingPage })));
const BKStudentsPage = lazy(() => import("@/pages/bk/students-page").then((module) => ({ default: module.BKStudentsPage })));
const BKSubmissionsPage = lazy(() => import("@/pages/bk/submissions-page").then((module) => ({ default: module.BKSubmissionsPage })));
const StudentDashboardPage = lazy(() => import("@/pages/student/dashboard-page").then((module) => ({ default: module.StudentDashboardPage })));
const StudentHistoryPage = lazy(() => import("@/pages/student/history-page").then((module) => ({ default: module.StudentHistoryPage })));
const StudentProfilePage = lazy(() => import("@/pages/student/profile-page").then((module) => ({ default: module.StudentProfilePage })));
const WalasDashboardPage = lazy(() => import("@/pages/teacher/homeroom/dashboard-page").then((module) => ({ default: module.WalasDashboardPage })));
const WalasAttendancePage = lazy(() => import("@/pages/teacher/homeroom/attendance-page").then((module) => ({ default: module.WalasAttendancePage })));
const WalasStudentsPage = lazy(() => import("@/pages/teacher/homeroom/students-page").then((module) => ({ default: module.WalasStudentsPage })));
const WalasSubmissionsPage = lazy(() => import("@/pages/teacher/homeroom/submissions-page").then((module) => ({ default: module.WalasSubmissionsPage })));
const MapelDashboardPage = lazy(() => import("@/pages/teacher/subject/dashboard-page").then((module) => ({ default: module.MapelDashboardPage })));
const MapelHistoryPage = lazy(() => import("@/pages/teacher/subject/history-page").then((module) => ({ default: module.MapelHistoryPage })));
const MapelRecapPage = lazy(() => import("@/pages/teacher/subject/recap-page").then((module) => ({ default: module.MapelRecapPage })));
const MapelSessionPage = lazy(() => import("@/pages/teacher/subject/session-page").then((module) => ({ default: module.MapelSessionPage })));

function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}>{children}</Suspense>;
}

function DashboardRedirect() {
  const session = getAuthSession();
  return <Navigate replace to={session ? getDashboardPathForUser(session.user) : "/login/student"} />;
}

function HomeRoute() {
  const session = getAuthSession();
  return session ? <Navigate replace to={getDashboardPathForUser(session.user)} /> : <HomePage />;
}

function LoginRoute({ portal }: { portal: PortalType }) {
  const session = getAuthSession();
  return session ? <Navigate replace to={getDashboardPathForUser(session.user)} /> : <LoginPage portal={portal} />;
}

function TeacherDashboard() {
  const session = getAuthSession();
  if (!session) return <Navigate replace to="/login/staff" />;
  if (session.user.role !== "TEACHER") {
    return <Navigate replace to={getDashboardPathForUser(session.user)} />;
  }
  return session.user.has_bk_scope ? <BKDashboardPage /> : <WalasDashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <PageBoundary>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Navigate replace to="/login/student" />} />
          <Route path="/login/student" element={<LoginRoute portal="student" />} />
          <Route path="/login/staff" element={<LoginRoute portal="staff" />} />
          <Route path="/admin/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard/admin/admins" element={<AdminAdminsPage />} />
          <Route path="/dashboard/admin/classes" element={<AdminClassesPage />} />
          <Route path="/dashboard/admin/students" element={<AdminStudentsPage />} />
          <Route path="/dashboard/admin/subjects" element={<AdminSubjectsPage />} />
          <Route path="/dashboard/admin/teachers" element={<AdminTeachersPage />} />
          <Route path="/dashboard/admin/users" element={<AdminUsersPage />} />
          <Route path="/dashboard/admin/reports" element={<AdminPlaceholderPage title="Report" subtitle="Laporan dan rekap absensi" description="Halaman laporan akan menampilkan rekap absensi, insight sekolah, dan kebutuhan ekspor data setelah section ini dibuat." />} />

          <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          <Route path="/dashboard/teacher/bk/attendance" element={<BKAttendancePage />} />
          <Route path="/dashboard/teacher/bk/counseling" element={<BKCounselingPage />} />
          <Route path="/dashboard/teacher/bk/students" element={<BKStudentsPage />} />
          <Route path="/dashboard/teacher/bk/submissions" element={<BKSubmissionsPage />} />

          <Route path="/dashboard/siswa" element={<StudentDashboardPage />} />
          <Route path="/dashboard/siswa/history" element={<StudentHistoryPage />} />
          <Route path="/dashboard/siswa/profile" element={<StudentProfilePage />} />

          <Route path="/dashboard/teacher/homeroom" element={<WalasDashboardPage />} />
          <Route path="/dashboard/teacher/homeroom/attendance" element={<WalasAttendancePage />} />
          <Route path="/dashboard/teacher/homeroom/students" element={<WalasStudentsPage />} />
          <Route path="/dashboard/teacher/homeroom/submissions" element={<WalasSubmissionsPage />} />
          <Route path="/dashboard/teacher/subject" element={<MapelDashboardPage />} />
          <Route path="/dashboard/teacher/subject/history" element={<MapelHistoryPage />} />
          <Route path="/dashboard/teacher/subject/recap" element={<MapelRecapPage />} />
          <Route path="/dashboard/teacher/subject/session" element={<MapelSessionPage />} />

          <Route path="/dashboard/bk/*" element={<Navigate replace to="/dashboard/teacher" />} />
          <Route path="/dashboard/walas/*" element={<Navigate replace to="/dashboard/teacher" />} />

          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </PageBoundary>
    </BrowserRouter>
  );
}
