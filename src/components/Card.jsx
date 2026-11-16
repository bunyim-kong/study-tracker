import './Card.css'

export default function Card({ children, variant = 'default', className = '', as: Element = 'section', ...props }) {
  const classes = ['card', `card--${variant}`, className].filter(Boolean).join(' ')
  return (
    <Element className={classes} {...props}>
      {children}
    </Element>
  )
}
