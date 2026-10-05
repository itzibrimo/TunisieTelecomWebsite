"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

type CardVariant = "default" | "glass" | "gradient" | "interactive" | "bordered" | "glow" | "ghost";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-bg-elevated border border-border shadow-elevated",
  glass: "glass",
  gradient: "gradient-brand text-white border-0",
  interactive: "bg-bg-elevated border border-border shadow-elevated cursor-pointer",
  bordered: "bg-bg-elevated border border-border-2",
  glow: "bg-bg-elevated border border-primary/20 shadow-elevated hover:shadow-lg hover:shadow-primary/10",
  ghost: "bg-transparent",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    const baseClasses = `rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

    if (variant === "interactive") {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={baseClasses}
          {...(props as Record<string, unknown>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/* Card Header */
function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}
CardHeader.displayName = "CardHeader";

/* Card Body */
function CardBody({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
CardBody.displayName = "CardBody";

/* Card Footer */
function CardFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pb-6 pt-4 border-t border-border ${className}`} {...props}>
      {children}
    </div>
  );
}
CardFooter.displayName = "CardFooter";

export default Card;
export { CardHeader, CardBody, CardFooter };
