import { Navigate, Route, Routes } from 'react-router-dom'
import StyleGuidePage from './pages/StyleGuidePage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/styleguide" element={<StyleGuidePage />} />
      <Route path="*" element={<Navigate to="/styleguide" replace />} />
    </Routes>
  )
}
