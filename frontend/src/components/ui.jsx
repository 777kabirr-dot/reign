// Small set of styled primitives shared across pages. White-only palette,
// generous spacing, sharp cards — Linear/Vercel register.

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-card border border-subtle bg-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary:
      "border border-subtle bg-elevated text-white hover:border-hover",
    ghost: "text-white/60 hover:text-white hover:bg-white/5",
    danger:
      "border border-subtle bg-transparent text-white/70 hover:border-hover hover:text-white",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <span
      className={`spin inline-block rounded-full border-2 border-white/20 border-t-white ${className}`}
    />
  );
}

export function Label({ children, hint }) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-white/45">
      <span>{children}</span>
      {hint && <span className="font-mono normal-case tracking-normal">{hint}</span>}
    </label>
  );
}

const fieldClass =
  "w-full rounded-btn border border-subtle bg-elevated px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-hover";

export function Input(props) {
  return <input className={fieldClass} {...props} />;
}

export function Textarea({ rows = 4, ...props }) {
  return <textarea rows={rows} className={`${fieldClass} resize-y`} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={`${fieldClass} appearance-none`} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

export function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-subtle px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white/55 ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-white/45">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, subtitle, action }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-subtle font-mono text-white/40">
        ∅
      </div>
      <p className="text-sm font-medium text-white/80">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-white/40">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
