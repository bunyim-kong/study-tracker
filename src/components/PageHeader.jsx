import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import './PageHeader.css'

export default function PageHeader({ eyebrow, title, description, backTo, actions }) {
  return (
    <header className="page-header">
      {backTo ? <Link className="page-header__back" to={backTo}><ArrowLeft aria-hidden="true" /> Back</Link> : null}
      <div className="page-header__row">
        <div>
          {eyebrow ? <span className="page-header__eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </header>
  )
}
