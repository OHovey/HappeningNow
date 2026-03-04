import type { GeoJSONEventProperties } from '@/lib/supabase/types';
import { formatMonthRange } from '@/lib/affiliates';
import { CATEGORY_COLORS } from '@/lib/constants';

const CATEGORY_GRADIENTS: Record<string, string> = {
  festival: 'linear-gradient(160deg, #c2410c 0%, #7c2d12 50%, #451a03 100%)',
  concert: 'linear-gradient(160deg, #7e22ce 0%, #581c87 50%, #3b0764 100%)',
  sport: 'linear-gradient(160deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
  arts: 'linear-gradient(160deg, #db2777 0%, #9d174d 50%, #831843 100%)',
  event: 'linear-gradient(160deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)',
  wildlife: 'linear-gradient(160deg, #15803d 0%, #065f46 50%, #022c22 100%)',
};

interface MarkerPopupProps {
  event: GeoJSONEventProperties;
  onViewDetails: () => void;
}

export default function MarkerPopup({ event, onViewDetails }: MarkerPopupProps) {
  const dateText = formatMonthRange(event.start_month, event.end_month);
  const locationText = [event.region, event.country].filter(Boolean).join(', ');
  const gradient =
    CATEGORY_GRADIENTS[event.category] ||
    'linear-gradient(160deg, #4338ca 0%, #312e81 50%, #1e1b4b 100%)';
  const categoryColor = `var(--${event.category}, var(--festival))`;

  return (
    <div
      style={{
        width: 260,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: gradient }} />
        )}
        {/* Category pill */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: categoryColor,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            textTransform: 'capitalize',
          }}
        >
          {event.category}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px 12px' }}>
        {/* Name */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {event.name}
        </div>

        {/* Metadata line */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {[dateText, locationText].filter(Boolean).join(' · ')}
        </div>

        {/* View details button */}
        <button
          onClick={onViewDetails}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '7px 0',
            fontSize: 13,
            fontWeight: 600,
            color: categoryColor,
            background: 'transparent',
            border: `1.5px solid ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.festival}`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background =
              `var(--${event.category}-surface, var(--festival-surface))`;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          View details
        </button>
      </div>
    </div>
  );
}
