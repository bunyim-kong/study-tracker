import './Button.css'

export default function Button({
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
}) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
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
}
