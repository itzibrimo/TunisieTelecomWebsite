"use client";

import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  useState,
  useRef,
  useCallback,
  type Ref,
} from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success" | "brand";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asLink?: boolean;
  href?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 active:bg-primary-dark active:scale-[0.98] disabled:bg-primary/50 disabled:text-white/70 disabled:shadow-none",
  secondary:
    "bg-surface-2 text-foreground hover:bg-surface-3 border border-border hover:border-border-2 active:scale-[0.98] dark:bg-surface-3 dark:hover:bg-surface-4",
  ghost:
    "text-foreground hover:bg-surface-2 active:bg-surface-3 active:scale-[0.98]",
  outline:
    "border border-border-2 text-foreground hover:bg-surface-2 hover:border-primary/30 active:scale-[0.98]",
  danger:
    "bg-error text-white hover:bg-error-600 shadow-md shadow-error/20 hover:shadow-lg hover:shadow-error/25 active:bg-error-dark active:scale-[0.98] disabled:bg-error/50",
  success:
    "bg-success text-white hover:bg-success-600 shadow-md shadow-success/20 hover:shadow-lg hover:shadow-success/25 active:bg-success-dark active:scale-[0.98] disabled:bg-success/50",
  brand:
    "gradient-brand text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2.5",
  xl: "h-14 px-8 text-base rounded-2xl gap-3",
};

const iconOnlySizes: Record<Size, string> = {
  xs: "h-7 w-7 rounded-lg",
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-xl",
  xl: "h-14 w-14 rounded-2xl",
};

function Spinner({ size: s = "sm" }: { size?: "sm" | "md" }) {
  const dim = s === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <svg className={`animate-spin ${dim}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* RippleButton — extracted outside render to satisfy react-hooks/static-components */
function RippleButton({
  isLoading,
  classes,
  content,
  disabled,
  onClick,
  type,
  ...rest
}: {
  isLoading?: boolean;
  classes: string;
  content: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      }
      onClick?.(e);
    },
    [onClick]
  );

  return (
    <button
      ref={btnRef}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
      onClick={handleClick}
    >
      <span className="relative z-10 flex items-center gap-2">{content}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/20 animate-ping"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
        />
      ))}
    </button>
  );
}
RippleButton.displayName = "RippleButton";

/* Button */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      asLink,
      href,
      className = "",
      disabled,
      loading,
      icon,
      iconRight,
      iconOnly,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 font-[family-name:var(--font-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

    const classes = [
      base,
      variantStyles[variant],
      iconOnly ? iconOnlySizes[size] : sizeStyles[size],
      fullWidth && "w-full",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {loading ? (
          <Spinner />
        ) : icon ? (
          <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        ) : null}
        {children && !iconOnly && <span className={loading ? "opacity-70" : ""}>{children}</span>}
        {iconRight && !loading && !iconOnly && (
          <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{iconRight}</span>
        )}
      </>
    );

    if (asLink && href) {
      return (
        <Link href={href} className={classes} aria-disabled={disabled || undefined}>
          {content}
        </Link>
      );
    }

    return (
      <RippleButton
        ref={ref as Ref<HTMLButtonElement>}
        isLoading={loading}
        classes={classes}
        content={content}
        disabled={disabled}
        onClick={props.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
