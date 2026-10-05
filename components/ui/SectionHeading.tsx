import { memo } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  badge?: string;
  className?: string;
}

function SectionHeading({
  title,
  subtitle,
  align = "center",
  badge,
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      {badge && (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-semibold mb-4 dark:bg-primary/15 dark:text-primary-light">
          {badge}
        </span>
      )}
      <h2 className="font-[family-name:var(--font-display)] font-bold tracking-tight text-foreground text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-lg text-muted max-w-2xl leading-relaxed ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default memo(SectionHeading);
