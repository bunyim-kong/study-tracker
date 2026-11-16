import { Navigate, Route, Routes } from 'react-router-dom'
import LearnerLayout from './components/LearnerLayout.jsx'
import { AdminRoute, LearnerRoute, PublicOnlyRoute } from './components/RouteGuards.jsx'
import { LearnerDataProvider } from './context/LearnerDataContext.jsx'
import AdminPlaceholderPage from './pages/AdminPlaceholderPage.jsx'
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

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPlaceholderPage />} />
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
