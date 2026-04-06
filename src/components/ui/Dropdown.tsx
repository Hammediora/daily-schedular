// src/components/ui/Dropdown.tsx
"use client";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  className?: string;
}

export default function Dropdown({ id, value, onChange, options, label, className = "" }: DropdownProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`w-full bg-background border border-border rounded px-3 py-2 min-h-11 sm:min-h-9 text-sm font-sans text-foreground focus:outline-none focus:border-primary transition-colors ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
