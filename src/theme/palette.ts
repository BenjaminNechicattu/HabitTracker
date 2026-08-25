export function buildPalette(darkMode: boolean, amoled = false) {
  return darkMode
    ? {
        bg: '#000000',
        card: amoled ? '#000000' : '#0d0d0d',
        text: '#f3f3f3',
        muted: '#a9a9a9',
        accent: '#22c55e',
        accent2: '#4ade80',
        border: amoled ? '#181818' : '#2a2a2a',
      }
    : {
        bg: '#eefaf1',
        card: '#ffffff',
        text: '#1e2f26',
        muted: '#5d7568',
        accent: '#22c55e',
        accent2: '#4ade80',
        border: '#d3f4dd',
      };
}
