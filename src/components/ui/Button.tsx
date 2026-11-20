import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0C0B0A] disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary:
        "bg-[#E85D3F] text-white hover:bg-[#D14628] focus:ring-[#E85D3F] shadow-sm shadow-[#E85D3F]/20",
      secondary:
        "bg-[#1E1B18] text-[#F5F0E8] hover:bg-[#2A2622] focus:ring-[#A89F94] border border-white/[0.1]",
      outline:
        "border border-white/[0.14] text-[#F5F0E8] hover:bg-white/[0.06] hover:border-white/[0.25] focus:ring-[#A89F94]",
      ghost:
        "text-[#A89F94] hover:bg-white/[0.06] hover:text-[#F5F0E8] focus:ring-[#A89F94]",
      danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
      success: "bg-[#4E9F76] text-white hover:bg-[#3F8863] focus:ring-[#4E9F76]",
    };

    const sizes = {
      sm: "h-8 px-3.5 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-sm sm:text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
