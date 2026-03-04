'use client';

import LocationInput from '@/components/search/LocationInput';
import type { SelectedLocation } from '@/components/search/SearchPage';

const MONTHS = [
  { value: '', label: 'Any' },
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'festival', label: 'Festivals' },
  { value: 'wildlife', label: 'Wildlife' },
];

const DISTANCES = [
  { value: '50000', label: '50 km' },
  { value: '100000', label: '100 km' },
  { value: '200000', label: '200 km' },
  { value: '500000', label: '500 km' },
];

interface SearchBarProps {
  locationName: string;
  onLocationSelect: (loc: SelectedLocation) => void;
  startMonth: number | null;
  onStartMonthChange: (m: number | null) => void;
  endMonth: number | null;
  onEndMonthChange: (m: number | null) => void;
  category: string | null;
  onCategoryChange: (c: string | null) => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

const selectStyles: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  outline: 'none',
};

export default function SearchBar({
  locationName,
  onLocationSelect,
  startMonth,
  onStartMonthChange,
  endMonth,
  onEndMonthChange,
  category,
  onCategoryChange,
  radius,
  onRadiusChange,
}: SearchBarProps) {
  return (
    <div
      className="flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Location */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="location-input" className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-text-tertiary">
          Location
        </label>
        <LocationInput
          initialValue={locationName}
          onSelect={onLocationSelect}
        />
      </div>

      {/* Start month */}
      <div className="w-full sm:w-auto">
        <label htmlFor="start-month" className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-text-tertiary">
          From
        </label>
        <select
          id="start-month"
          value={startMonth ?? ''}
          onChange={(e) => onStartMonthChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="w-full px-3 py-2.5 text-sm sm:w-24"
          style={selectStyles}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* End month */}
      <div className="w-full sm:w-auto">
        <label htmlFor="end-month" className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-text-tertiary">
          To
        </label>
        <select
          id="end-month"
          value={endMonth ?? ''}
          onChange={(e) => onEndMonthChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="w-full px-3 py-2.5 text-sm sm:w-24"
          style={selectStyles}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="w-full sm:w-auto">
        <label htmlFor="category-select" className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-text-tertiary">
          Category
        </label>
        <select
          id="category-select"
          value={category ?? ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="w-full px-3 py-2.5 text-sm sm:w-28"
          style={selectStyles}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Distance */}
      <div className="w-full sm:w-auto">
        <label htmlFor="distance-select" className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-text-tertiary">
          Distance
        </label>
        <select
          id="distance-select"
          value={String(radius)}
          onChange={(e) => onRadiusChange(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2.5 text-sm sm:w-28"
          style={selectStyles}
        >
          {DISTANCES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
