import { Route, BrowserRouter as Router, Routes } from "react-router";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import { OrgProvider } from "./context/OrgContext";
import { PresenceProvider } from "./context/PresenceContext";
import AppLayout from "./layout/AppLayout";
import FinancalSpt from "./pages/Admin/FinancalSpt";
import OrganSettings from "./pages/Admin/OrganSettings";
import ProjectSights from "./pages/Admin/ProjectSights";
import ResetPasswordPage from "./pages/AuthPages/ResetPassword";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyEmail from "./pages/AuthPages/VerifyEmail";
import Blank from "./pages/Blank";
import CashbookDetails from "./pages/Cashbooks/CashbookDetails";
import CashbookMembers from "./pages/Cashbooks/CashbookMembers";
import Cashbooks from "./pages/Cashbooks/Cashbooks";
import EmployeeDashboard from "./pages/Employee/Dashboard";
import Expense from "./pages/Employee/Expense";
import Organisation from "./pages/Employee/Organisation";
import PersonalFinance from "./pages/Employee/PerFinance";
import Planner from "./pages/Employee/Planner";
import Presence from "./pages/Employee/Presence";
import ProjectDetails from "./pages/Employee/ProjectDetails";
import Projects from "./pages/Employee/Projects";
import Tasks from "./pages/Employee/Tasks";
import HRDashboard from "./pages/HumanRs/Dashboard";
import LeavesPerformance from "./pages/HumanRs/Leaves_petformance";
import HRPresence from "./pages/HumanRs/Presence";
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";
import Settings from "./pages/Settings";
import Orgmgt from "./pages/SuperAdmin/Orgmgt";
import SecurityAudit from "./pages/SuperAdmin/SecurityAudit";
import UserDir from "./pages/SuperAdmin/UserDir";
import UserProfiles from "./pages/UserProfiles";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route element={
            <ProtectedRoute>
              <OrganizationProvider>
                <OrgProvider>
                  <PresenceProvider>
                    <NotificationProvider>
                      <AppLayout />
                    </NotificationProvider>
                  </PresenceProvider>
                </OrgProvider>
              </OrganizationProvider>
            </ProtectedRoute>
          }>
            {/* Dashboard - All authenticated users */}
            <Route index path="/" element={<EmployeeDashboard />} />
            <Route path="/dashboard" element={<EmployeeDashboard />} />

            {/* Common Pages - All authenticated users */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/organisation" element={<Organisation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cashbooks" element={<Cashbooks />} />
            <Route path="/cashbooks/:id" element={<CashbookDetails />} />
            <Route path="/cashbooks/:id/members" element={<CashbookMembers />} />


            {/* Employee Routes - MEMBER and above */}
            <Route path="/tasks" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/projects/:projectId" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <ProjectDetails />
              </ProtectedRoute>
            } />
            <Route path="/presence" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <Presence />
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <Expense />
              </ProtectedRoute>
            } />
            <Route path="/planner" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER"]}>
                <Planner />
              </ProtectedRoute>
            } />
            <Route path="/personal-finance" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]}>
                <PersonalFinance />
              </ProtectedRoute>
            } />

            {/* Manager Routes - MANAGER and above */}
            <Route path="/project-oversight" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MANAGER"]}>
                <ProjectSights />
              </ProtectedRoute>
            } />

            {/* Admin/HR Routes - ADMIN and above */}
            <Route path="/financials" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <FinancalSpt />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <HRDashboard />
              </ProtectedRoute>
            } />
            <Route path="/presence-attendance" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <HRPresence />
              </ProtectedRoute>
            } />
            <Route path="/performance" element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <LeavesPerformance />
              </ProtectedRoute>
            } />

            {/* Super Admin Routes - OWNER only */}
            <Route path="/organisations" element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <Orgmgt />
              </ProtectedRoute>
            } />
            <Route path="/system-audits" element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <SecurityAudit />
              </ProtectedRoute>
            } />
            <Route path="/global-users" element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <UserDir />
              </ProtectedRoute>
            } />
            <Route path="/organisations-settings" element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <OrganSettings />
              </ProtectedRoute>
            } />
          </Route>

          {/* Auth Routes - Public */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
