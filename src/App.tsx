import { getAuthSession, getDashboardPathForRole } from "@/lib/auth";
import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/home-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const AdminDashboardPage = lazy(() => import("@/components/dashboard/admin/pages/admin-dashboard-page").then((module) => ({ default: module.AdminDashboardPage })));
const AdminAdminsPage = lazy(() => import("@/components/dashboard/admin/pages/admin-admins-page").then((module) => ({ default: module.AdminAdminsPage })));
const AdminClassesPage = lazy(() => import("@/components/dashboard/admin/pages/admin-classes-page").then((module) => ({ default: module.AdminClassesPage })));
const AdminStudentsPage = lazy(() => import("@/components/dashboard/admin/pages/admin-students-page").then((module) => ({ default: module.AdminStudentsPage })));
const AdminSubjectsPage = lazy(() => import("@/components/dashboard/admin/pages/admin-subjects-page").then((module) => ({ default: module.AdminSubjectsPage })));
const AdminTeachersPage = lazy(() => import("@/components/dashboard/admin/pages/admin-teachers-page").then((module) => ({ default: module.AdminTeachersPage })));
const AdminUsersPage = lazy(() => import("@/components/dashboard/admin/pages/admin-users-page").then((module) => ({ default: module.AdminUsersPage })));
const AdminPlaceholderPage = lazy(() => import("@/components/dashboard/admin/pages/admin-placeholder-page").then((module) => ({ default: module.AdminPlaceholderPage })));
const BKDashboardPage = lazy(() => import("@/components/dashboard/bk/bk-dashboard-page").then((module) => ({ default: module.BKDashboardPage })));
const BKAttendancePage = lazy(() => import("@/components/dashboard/bk/bk-attendance-page").then((module) => ({ default: module.BKAttendancePage })));
const BKCounselingPage = lazy(() => import("@/components/dashboard/bk/bk-counseling-page").then((module) => ({ default: module.BKCounselingPage })));
const BKStudentsPage = lazy(() => import("@/components/dashboard/bk/bk-students-page").then((module) => ({ default: module.BKStudentsPage })));
const BKSubmissionsPage = lazy(() => import("@/components/dashboard/bk/bk-submissions-page").then((module) => ({ default: module.BKSubmissionsPage })));
const StudentDashboardPage = lazy(() => import("@/components/dashboard/student/student-dashboard-page").then((module) => ({ default: module.StudentDashboardPage })));
const StudentHistoryPage = lazy(() => import("@/components/dashboard/student/student-history-page").then((module) => ({ default: module.StudentHistoryPage })));
const StudentProfilePage = lazy(() => import("@/components/dashboard/student/student-profile-page").then((module) => ({ default: module.StudentProfilePage })));
const WalasDashboardPage = lazy(() => import("@/components/dashboard/walas/walas-dashboard-page").then((module) => ({ default: module.WalasDashboardPage })));
const WalasAttendancePage = lazy(() => import("@/components/dashboard/walas/walas-attendance-page").then((module) => ({ default: module.WalasAttendancePage })));
const WalasStudentsPage = lazy(() => import("@/components/dashboard/walas/walas-students-page").then((module) => ({ default: module.WalasStudentsPage })));
const WalasSubmissionsPage = lazy(() => import("@/components/dashboard/walas/walas-submissions-page").then((module) => ({ default: module.WalasSubmissionsPage })));
const MapelDashboardPage = lazy(() => import("@/components/dashboard/walas/mapel-dashboard-page").then((module) => ({ default: module.MapelDashboardPage })));
const MapelHistoryPage = lazy(() => import("@/components/dashboard/walas/mapel-history-page").then((module) => ({ default: module.MapelHistoryPage })));
const MapelRecapPage = lazy(() => import("@/components/dashboard/walas/mapel-recap-page").then((module) => ({ default: module.MapelRecapPage })));
const MapelSessionPage = lazy(() => import("@/components/dashboard/walas/mapel-session-page").then((module) => ({ default: module.MapelSessionPage })));

function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}>{children}</Suspense>;
}

function DashboardRedirect() {
  const session = getAuthSession();
  return <Navigate replace to={session ? getDashboardPathForRole(session.user.role) : "/login"} />;
}

export default function App() {
  return (
    <PageBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<Navigate replace to="/dashboard/admin" />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
        <Route path="/dashboard/admin/admins" element={<AdminAdminsPage />} />
        <Route path="/dashboard/admin/classes" element={<AdminClassesPage />} />
        <Route path="/dashboard/admin/students" element={<AdminStudentsPage />} />
        <Route path="/dashboard/admin/subjects" element={<AdminSubjectsPage />} />
        <Route path="/dashboard/admin/teachers" element={<AdminTeachersPage />} />
        <Route path="/dashboard/admin/users" element={<AdminUsersPage />} />
        <Route path="/dashboard/admin/reports" element={<AdminPlaceholderPage title="Report" subtitle="Laporan dan rekap absensi" description="Halaman laporan akan menampilkan rekap absensi, insight sekolah, dan kebutuhan ekspor data setelah section ini dibuat." />} />

        <Route path="/dashboard/bk" element={<BKDashboardPage />} />
        <Route path="/dashboard/bk/attendance" element={<BKAttendancePage />} />
        <Route path="/dashboard/bk/counseling" element={<BKCounselingPage />} />
        <Route path="/dashboard/bk/students" element={<BKStudentsPage />} />
        <Route path="/dashboard/bk/submissions" element={<BKSubmissionsPage />} />

        <Route path="/dashboard/siswa" element={<StudentDashboardPage />} />
        <Route path="/dashboard/siswa/history" element={<StudentHistoryPage />} />
        <Route path="/dashboard/siswa/profile" element={<StudentProfilePage />} />

        <Route path="/dashboard/walas" element={<WalasDashboardPage />} />
        <Route path="/dashboard/walas/attendance" element={<WalasAttendancePage />} />
        <Route path="/dashboard/walas/students" element={<WalasStudentsPage />} />
        <Route path="/dashboard/walas/submissions" element={<WalasSubmissionsPage />} />
        <Route path="/dashboard/walas/mapel" element={<MapelDashboardPage />} />
        <Route path="/dashboard/walas/mapel/history" element={<MapelHistoryPage />} />
        <Route path="/dashboard/walas/mapel/recap" element={<MapelRecapPage />} />
        <Route path="/dashboard/walas/mapel/session" element={<MapelSessionPage />} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </PageBoundary>
  );
}
