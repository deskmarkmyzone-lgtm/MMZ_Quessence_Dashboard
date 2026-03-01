"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
  loading?: boolean;
}

const colorMap = {
  primary: {
    bg: "bg-accent/10",
    text: "text-accent",
    icon: "text-accent",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    icon: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    icon: "text-warning",
  },
  danger: {
    bg: "bg-danger/10",
    text: "text-danger",
    icon: "text-danger",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info",
    icon: "text-info",
  },
};

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    prevEnd.current = end;

    const startTime = performance.now();
    const startVal = 0;

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, [end, duration]);

  return count;
}

export function KPICard({
  title,
  value,
  previousValue,
  icon: Icon,
  prefix = "",
  suffix = "",
  color = "primary",
  onClick,
  loading = false,
}: KPICardProps) {
  const displayValue = useCountUp(value);
  const colors = colorMap[color];

  const trend =
    previousValue !== undefined && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : undefined;

  if (loading) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 skeleton-shimmer rounded" />
          <div className="h-10 w-10 skeleton-shimmer rounded-md" />
        </div>
        <div className="h-8 w-20 skeleton-shimmer rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-bg-card border border-border-primary rounded-lg p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-card-hover hover:border-border-active"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-caption text-text-secondary uppercase tracking-wider">
          {title}
        </p>
        <div className={cn("h-10 w-10 rounded-md flex items-center justify-center", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-kpi text-text-primary">
          {prefix}
          {prefix === "₹"
            ? displayValue.toLocaleString("en-IN")
            : displayValue.toLocaleString()}
          {suffix}
        </p>
        {trend !== undefined && (
          <span
            className={cn(
              "text-badge px-1.5 py-0.5 rounded-full mb-1",
              trend >= 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
