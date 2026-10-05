"use client";

import { type InputHTMLAttributes, forwardRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  floating?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, icon, className = "", type, required, id, maxLength, showCounter, floating = false, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const isPassword = type === "password";
    const currentValue = (value as string) || "";
    const charCount = currentValue.length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    /* ── Floating Label Mode ── */
    if (floating) {
      return (
        <div className="space-y-1">
          <div className="relative group">
            {icon && (
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 ${focused ? "text-primary" : "text-muted-foreground"}`}>
                {icon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              type={isPassword ? (showPassword ? "text" : "password") : type}
              required={required}
              maxLength={maxLength}
              value={value}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder=" "
              aria-invalid={!!error}
              aria-describedby={describedBy}
              className={`peer w-full h-12 rounded-lg bg-bg-elevated border text-foreground text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed ${
                icon ? "pl-10" : "pl-3.5"
              } ${isPassword ? "pr-10" : showCounter && maxLength ? "pr-14" : "pr-3.5"} ${
                error ? "border-error focus:ring-ring-error focus:border-error" : "border-border hover:border-border-2"
              } ${className}`}
              {...props}
            />
            <label
              htmlFor={inputId}
              className={`absolute left-3.5 transition-all duration-200 pointer-events-none z-10 ${
                icon ? "left-10" : ""
              } ${
                focused || hasValue
                  ? "top-1.5 text-[10px] font-medium text-primary"
                  : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              }`}
            >
              {label}
              {required && <span className="text-error ml-0.5">*</span>}
            </label>
            {showCounter && maxLength && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums ${charCount > maxLength * 0.9 ? "text-warning" : "text-placeholder"}`}>
                {charCount}/{maxLength}
              </span>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 z-10"
                tabIndex={-1}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            )}
          </div>
          <AnimatePresence>
            {error && (
              <motion.p id={`${inputId}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs text-error font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      );
    }

    /* ── Standard Label Mode ── */
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error text-xs">*</span>}
        </label>
        <div className="relative group">
          {icon && (
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? "text-primary" : "text-muted-foreground"}`}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            required={required}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`w-full h-10 rounded-lg bg-bg-elevated border text-foreground text-sm placeholder:text-placeholder transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? "pl-10" : "pl-3.5"
            } ${isPassword ? "pr-10" : showCounter && maxLength ? "pr-14" : "pr-3.5"} ${
              error ? "border-error focus:ring-ring-error focus:border-error" : "border-border hover:border-border-2"
            } ${className}`}
            {...props}
          />
          {showCounter && maxLength && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums ${charCount > maxLength * 0.9 ? "text-warning" : "text-placeholder"}`}>
              {charCount}/{maxLength}
            </span>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              tabIndex={-1}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p id={`${inputId}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs text-error font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
