import { useMemo } from "react";

const DEMO_COUNT = 3; // Actualizar cuando agregues más videos

export default function BackgroundVideo() {
  const videoIndex = useMemo(() => Math.floor(Math.random() * DEMO_COUNT), []);

  return (
    <>
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={`/demos/demo_${videoIndex}.mp4`} type="video/mp4" />
      </video>
      <div className="bg-overlay"></div>
    </>
  );
}
