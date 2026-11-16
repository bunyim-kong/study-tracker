import { Navigate, Route, Routes } from 'react-router-dom'
import LearnerLayout from './components/LearnerLayout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import { AdminRoute, LearnerRoute, PublicOnlyRoute } from './components/RouteGuards.jsx'
import { LearnerDataProvider } from './context/LearnerDataContext.jsx'
import BadgesPage from './pages/BadgesPage.jsx'
import DayPage from './pages/DayPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotePage from './pages/NotePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import SessionPage from './pages/SessionPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import StyleGuidePage from './pages/StyleGuidePage.jsx'
import TodayPage from './pages/TodayPage.jsx'
import WeekPage from './pages/WeekPage.jsx'
import AdminAssignPage from './pages/admin/AdminAssignPage.jsx'
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminLearnerPage from './pages/admin/AdminLearnerPage.jsx'
import AdminPlanEditorPage from './pages/admin/AdminPlanEditorPage.jsx'
import AdminPlansPage from './pages/admin/AdminPlansPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="learners/:id" element={<AdminLearnerPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="plans/:id" element={<AdminPlanEditorPage />} />
          <Route path="assign" element={<AdminAssignPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route element={<LearnerRoute />}>
        <Route
          path="/app"
          element={(
            <LearnerDataProvider>
              <LearnerLayout />
            </LearnerDataProvider>
          )}
        >
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="day/:dayNumber" element={<DayPage />} />
          <Route path="session/:sessionId" element={<SessionPage />} />
          <Route path="week" element={<WeekPage />} />
          <Route path="note/:dayNumber" element={<NotePage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/styleguide" element={<StyleGuidePage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
