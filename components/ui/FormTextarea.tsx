"use client";

import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  showCounter?: boolean;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, required, maxLength, showCounter, className = "", id, value, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const currentValue = (value as string) || "";
    const charCount = currentValue.length;

    const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        <label htmlFor={textareaId} className="flex items-center justify-between text-sm font-medium text-foreground">
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-error text-xs">*</span>}
          </span>
          {showCounter && maxLength && (
            <span className={`text-[10px] font-mono tabular-nums ${charCount > maxLength * 0.9 ? "text-warning" : "text-placeholder"}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          maxLength={maxLength}
          value={value}
          onFocus={() => {}}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full min-h-[100px] rounded-lg bg-bg-elevated border text-foreground text-sm placeholder:text-placeholder px-3.5 py-2.5 transition-all duration-200 resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-error focus:ring-ring-error focus:border-error"
              : "border-border hover:border-border-2"
          } ${className}`}
          {...props}
        />
        <AnimatePresence>
          {error && (
            <motion.p id={`${textareaId}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs text-error font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {hint && !error && <p id={`${textareaId}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
export default FormTextarea;
