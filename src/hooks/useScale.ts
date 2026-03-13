import { useState, useEffect } from 'react';

const guidelineBaseWidth = 375; // iPhone base width

export function useScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      // We only scale for mobile/tablet viewports.
      // Above 1024px (desktop), we keep scale 1 or a limited scale for readability.
      if (width < 1024) {
        setScale(width / guidelineBaseWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const s = (size: number) => size * scale;

  return { s, scale };
}
