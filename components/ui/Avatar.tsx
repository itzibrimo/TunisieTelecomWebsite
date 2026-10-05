"use client";

import { memo, useState } from "react";

/* =============================================================================
 * Avatar — User/Entity avatar with image, initials, status indicator
 * ============================================================================= */

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  away: "bg-warning",
  busy: "bg-error",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const bgColors = [
  "bg-primary text-white",
  "bg-gold text-white",
  "bg-success text-white",
  "bg-info text-white",
  "bg-error text-white",
  "bg-accent-cyan text-white",
  "bg-accent-pink text-white",
  "bg-accent-cyan text-white",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

function AvatarInner({ src, alt = "", name = "", size = "md", status, className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : "?";

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold overflow-hidden ${
          showImage ? "" : getColorFromName(name)
        }`}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-bg ${statusColors[status]} ${
            size === "xs" ? "h-1.5 w-1.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
          }`}
        />
      )}
    </div>
  );
}

const Avatar = memo(AvatarInner);
export default Avatar;

/* =============================================================================
 * AvatarGroup — Overlapping avatar stack
 * ============================================================================= */

interface AvatarGroupProps {
  avatars: { src?: string | null; name?: string }[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const AvatarGroupInner = function AvatarGroup({ avatars, max = 3, size = "sm", className = "" }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible.map((a, i) => (
        <div key={i} className="relative ring-2 ring-bg rounded-full">
          <Avatar src={a.src} name={a.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`relative inline-flex items-center justify-center rounded-full bg-surface-2 text-muted font-medium ring-2 ring-bg ${sizeMap[size]}`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};
const AvatarGroup = memo(AvatarGroupInner);
export { AvatarGroup };
