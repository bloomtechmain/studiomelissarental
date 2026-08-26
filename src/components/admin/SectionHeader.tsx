import type { ComponentType } from "react";

// Shared card-section heading for the admin panel — an icon badge plus a
// bottom rule so a section's title reads as a distinct header rather than
// blending into the body text below it (every admin card should use this
// instead of a bare <h2>).
export default function SectionHeader({
  icon: Icon,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center gap-2.5 border-b border-line pb-3 ${className ?? ""}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <h2 className="font-semibold text-navy">{children}</h2>
    </div>
  );
}
