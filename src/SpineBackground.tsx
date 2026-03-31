import { useEffect, useRef } from "react";
import { SpinePlayer } from "@esotericsoftware/spine-player";

export default function SpineBackground({
  animation,
  onComplete,
}: {
  animation: "idle" | "spin";
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = new SpinePlayer(containerRef.current, {
      jsonUrl: "/slot_bg.json",
      atlasUrl: "/slot_bg.atlas",

      animation: "idle",
      loop: true,

      alpha: true,
      backgroundColor: "#00000000",

      width: 1920,
      height: 1080,

      showControls: false,
    });

    playerRef.current = player;

    return () => {
      player.dispose();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (animation === "spin") {
      player.setAnimation("spin", false);

      setTimeout(() => {
        player.setAnimation("idle", true);
        onComplete();
      }, 1200);
    }
  }, [animation, onComplete]);

  return <div className="spine-container" ref={containerRef} />;
}
