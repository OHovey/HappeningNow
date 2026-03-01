import type maplibregl from 'maplibre-gl';

/**
 * Starts a pulse animation loop on the event-circles-pulse layer.
 * Modulates opacity and radius using a sine wave.
 * Returns a cleanup function that cancels the animation.
 */
export function startPulseAnimation(map: maplibregl.Map): () => void {
  let animationId: number;

  function animate(timestamp: number) {
    const sinVal = Math.sin(timestamp / 500);

    // Opacity oscillates between 0.1 and 0.4
    const opacity = 0.25 + 0.15 * sinVal;

    // Radius oscillates between 8 and 14
    const radius = 11 + 3 * sinVal;

    if (map.getLayer('event-circles-pulse')) {
      map.setPaintProperty('event-circles-pulse', 'circle-opacity', opacity);
      map.setPaintProperty('event-circles-pulse', 'circle-radius', radius);
    }

    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
  };
}
