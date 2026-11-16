import { forwardRef } from 'react'
import './Button.css'

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'start',
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}, ref) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="button__spinner" aria-hidden="true" /> : null}
      {!loading && Icon && iconPosition === 'start' ? <Icon size={20} aria-hidden="true" /> : null}
      <span>{loading ? 'Working…' : children}</span>
      {!loading && Icon && iconPosition === 'end' ? <Icon size={20} aria-hidden="true" /> : null}
    </button>
  )
})

export default Button
