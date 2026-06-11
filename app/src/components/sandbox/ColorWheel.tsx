import { useRef, useEffect, useCallback } from 'react';

interface ColorWheelProps {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ onChange, size = 175 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2, cy = size / 2, radius = size / 2 - 2;

    ctx.clearRect(0, 0, size, size);

    // Draw full disc: angle = hue, radius = saturation
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;

        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const saturation = dist / radius * 100;
        const idx = (y * size + x) * 4;
        const [r, g, b] = hslToRgb(angle, saturation, 50);
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Anti-alias the circle edge
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [size]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  const pickColor = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] === 0) return;
    const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
    onChange(hex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    pickColor(e);
    const onMove = (ev: MouseEvent) => { if (dragging.current) pickColor(ev); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'crosshair', borderRadius: '50%' }}
    />
  );
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
