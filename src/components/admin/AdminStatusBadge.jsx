import { getDashboardStatus } from '../../lib/adminDashboard.js'
import './AdminStatusBadge.css'

export default function AdminStatusBadge({ overview }) {
  const status = getDashboardStatus(overview)
  const slug = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`admin-status admin-status--${slug}`}>{status}</span>
}
