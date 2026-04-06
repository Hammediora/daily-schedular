"use client";

interface SliderProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatLabel: (value: number) => string;
  label?: string;
  className?: string;
}

export default function Slider({ id, value, onChange, min, max, step, formatLabel, label, className = "" }: SliderProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center">
        <span className="font-mono text-xs text-muted">{formatLabel(value)}</span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={formatLabel(value)}
          className="slider-input w-full h-0.5 rounded appearance-none bg-border accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}
