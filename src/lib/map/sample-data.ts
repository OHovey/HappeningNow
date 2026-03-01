/**
 * Sample GeoJSON event data for development.
 * Replaced by Supabase RPC fetch in plan 01-05.
 */
export const SAMPLE_EVENTS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9857, 40.7484] },
      properties: {
        id: 'sample-1',
        title: 'New York Jazz Festival',
        category: 'festival',
        scale: 8,
        month: 6,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
      properties: {
        id: 'sample-2',
        title: 'Paris Music Festival',
        category: 'festival',
        scale: 7,
        month: 6,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [36.8219, -1.2921] },
      properties: {
        id: 'sample-3',
        title: 'Great Wildebeest Migration',
        category: 'wildlife',
        scale: 10,
        month: 7,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [138.6007, -34.9285] },
      properties: {
        id: 'sample-4',
        title: 'Adelaide Fringe Festival',
        category: 'festival',
        scale: 6,
        month: 2,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.5018, 13.7563] },
      properties: {
        id: 'sample-5',
        title: 'Songkran Water Festival',
        category: 'festival',
        scale: 9,
        month: 4,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-64.7505, -18.1139] },
      properties: {
        id: 'sample-6',
        title: 'Monarch Butterfly Migration',
        category: 'wildlife',
        scale: 7,
        month: 10,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [139.6917, 35.6895] },
      properties: {
        id: 'sample-7',
        title: 'Cherry Blossom Season',
        category: 'other',
        scale: 5,
        month: 3,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-43.1729, -22.9068] },
      properties: {
        id: 'sample-8',
        title: 'Rio Carnival',
        category: 'festival',
        scale: 10,
        month: 2,
      },
    },
  ],
};
