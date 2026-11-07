import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm text-muted", className)} {...props} />;
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn("h-11 w-full border border-line bg-surface px-3 text-ink outline-none placeholder:text-muted/70 focus:border-ink", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn("min-h-36 w-full border border-line bg-surface px-3 py-3 text-ink outline-none placeholder:text-muted/70 focus:border-ink", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn("h-11 w-full border border-line bg-surface px-3 text-ink outline-none focus:border-ink", className)} {...props} />;
}
