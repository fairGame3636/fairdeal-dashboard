import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import Strings from "./utils/strings";

import AdminDashboardLayout from "./Layouts/AdminDashboardLayout";
import AgentDashboardLayout from "./Layouts/AgentDashboardLayout";
import SubAgentDashboardLayout from "./Layouts/SubAgentDashboardLayout";

//Auth
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ForgotPasswordPage from "./pages/auth/forgotpasswordpage";

//Dashboard
import DashboardHome from "./pages/dashboard/DashboardHome";

//User
import CreateAgentSubAgentPage from "./pages/user/CreateUserPage";
import UpdateStatusPage from "./pages/user/UpdateStatus";
import SearchUserPage from "./pages/user/SearchUser";
import BalanceAdjustmentPage from "./pages/fund/balanceAdjustment";
import KickoffUserPage from "./pages/user/KickoffUser";
import ListUsersPage from "./pages/user/UserListPage";
import UpdateCommissionPage from './pages/user/UpdateCommission';

//Reports
import PointFile from "./pages/reports/pointFile";
import OutPointsReport from "./pages/reports/OutPointFile";
import GameHistoryPage from "./pages/reports/GameHistory";
import TurnOverPage from "./pages/reports/TurnOver";
import InPointsReport from "./pages/reports/InPointFile";

//Game UI
import CasinoGameUI from "./pages/game/CasinoGameUI";
import ResultControlPage from  './pages/game/decideResult';

//Version update
import VersionUpdatePage from './pages/version/versionUpdate';

function ProtectedRoute({ allowedRoles, children }: { allowedRoles: string[], children: JSX.Element }) {
  const userRole = localStorage.getItem('userRole') || '';
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path={Strings.initialRoute} element={<LoginPage />} />
        <Route path={Strings.forgotPasswordRoute} element={<ForgotPasswordPage />} />

        {/* Admin Routes */}
        <Route path={Strings.AdminDashboard} element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path={Strings.GameUI} element={<CasinoGameUI />} />
          <Route path={Strings.VersionUpdate} element={<VersionUpdatePage />} />
          <Route path={Strings.CreateAgentOrSubagent} element={<CreateAgentSubAgentPage />} />
          <Route path={Strings.DecideResult} element={< ResultControlPage />} />
          <Route path={Strings.UpdateCommission} element={< UpdateCommissionPage />} />
          <Route path={Strings.UpdateStatusPage} element={<UpdateStatusPage />} />
          <Route path={Strings.ListUsersPage} element={<ListUsersPage />} />
          <Route path={Strings.resetPasswordRoute} element={<ResetPasswordPage />} />
          <Route path={Strings.SearchUser} element={<SearchUserPage />} />
          <Route path={Strings.BalanceAdjustment} element={<BalanceAdjustmentPage />} />
          <Route path={Strings.KickoffUser} element={<KickoffUserPage />} />
          <Route path={Strings.PointFile} element={<PointFile />} />
          <Route path={Strings.InPoints} element={<InPointsReport />} />
          <Route path={Strings.OutPoints} element={<OutPointsReport />} />
          <Route path={Strings.GameHistory} element={<GameHistoryPage/>} />
          <Route path={Strings.TurnOver} element={<TurnOverPage/>} />
        </Route>

        {/* Agent Routes */}
        <Route path={Strings.AgentDashboard} element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path={Strings.CreateSubAgent} element={<CreateAgentSubAgentPage />} />
          <Route path={Strings.GameUI} element={<CasinoGameUI />} />
          <Route path={Strings.SearchUser} element={<SearchUserPage />} />
          <Route path={Strings.UpdateCommission} element={< UpdateCommissionPage />} />
          <Route path={Strings.BalanceAdjustment} element={<BalanceAdjustmentPage />} />
          <Route path={Strings.KickoffUser} element={<KickoffUserPage />} />
          <Route path={Strings.PointFile} element={<PointFile />} />
          <Route path={Strings.InPoints} element={<InPointsReport />} />
          <Route path={Strings.OutPoints} element={<OutPointsReport />} />
          <Route path={Strings.GameHistory} element={<GameHistoryPage/>} />
          <Route path={Strings.TurnOver} element={<TurnOverPage/>} />
          <Route path={Strings.UpdateStatusPage} element={<UpdateStatusPage />} />
          <Route path={Strings.ListUsersPage} element={<ListUsersPage />} />
          <Route path={Strings.resetPasswordRoute} element={<ResetPasswordPage />} />
        </Route>

        {/* SubAgent Routes */}
        <Route path={Strings.SubAgentDashboard} element={
          <ProtectedRoute allowedRoles={['sub-agent']}>
            <SubAgentDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path={Strings.CreateUser} element={<CreateAgentSubAgentPage />} />
          <Route path={Strings.GameUI} element={<CasinoGameUI />} />
          <Route path={Strings.UpdateStatusPage} element={<UpdateStatusPage />} />
          <Route path={Strings.ListUsersPage} element={<ListUsersPage />} />
          <Route path={Strings.resetPasswordRoute} element={<ResetPasswordPage />} />
          <Route path={Strings.SearchUser} element={<SearchUserPage />} />
          <Route path={Strings.BalanceAdjustment} element={<BalanceAdjustmentPage />} />
          <Route path={Strings.KickoffUser} element={<KickoffUserPage />} />
          <Route path={Strings.PointFile} element={<PointFile />} />
          <Route path={Strings.InPoints} element={<InPointsReport />} />
          <Route path={Strings.OutPoints} element={<OutPointsReport />} />
          <Route path={Strings.GameHistory} element={<GameHistoryPage/>} />
          <Route path={Strings.TurnOver} element={<TurnOverPage/>} />
        </Route>

        {/* Redirect based on user role after login */}
        <Route path="/dashboard" element={<NavigateToRoleDashboard />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Component to redirect to appropriate dashboard based on role
function NavigateToRoleDashboard() {
  const userRole = localStorage.getItem('userRole') || '';
  
  switch(userRole) {
    case 'admin':
      return <Navigate to={Strings.AdminDashboard} replace />;
    case 'agent':
      return <Navigate to={Strings.AgentDashboard} replace />;
    case 'subagent':
      return <Navigate to={Strings.SubAgentDashboard} replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

export default AppRoutes;

