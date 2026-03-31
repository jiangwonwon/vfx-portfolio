import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import "./app.css";
import SpineBackground from "./SpineBackground";

const reel: string[] = [
  "videos/video1.mp4",
  "videos/video2.mp4",
  "videos/video3.mp4",
  "videos/video4.mp4",
  "videos/video5.mp4",
  "videos/video6.mp4",
  "videos/video7.mp4",
  "videos/video8.mp4",
  "videos/video9.mp4",
  "videos/video10.mp4",
  "videos/video11.mp4",
  "videos/video12.mp4",
];

const ITEM_HEIGHT = 480;

function Reel({ targetIndex }: { targetIndex: number }) {
  const controls = useAnimation();
  const isFirst = React.useRef(true);

  const TOTAL = reel.length;
  const LOOP_COUNT = 12;
  const SAFE_OFFSET = TOTAL * Math.floor(LOOP_COUNT / 2);

  const spinTo = async () => {
    const SPIN_LOOPS = 3;

    const baseIndex = SAFE_OFFSET + targetIndex;

    const targetY = -(
      baseIndex * ITEM_HEIGHT +
      SPIN_LOOPS * TOTAL * ITEM_HEIGHT
    );

    await controls.start({
      y: targetY,
      transition: {
        duration: 2.4,
        ease: [0.15, 0.8, 0.25, 1],
      },
    });

    controls.set({
      y: -(baseIndex * ITEM_HEIGHT),
    });
  };

  React.useEffect(() => {
    if (isFirst.current) {
      controls.set({
        y: -(SAFE_OFFSET + targetIndex) * ITEM_HEIGHT,
      });
      isFirst.current = false;
      return;
    }

    spinTo();
  }, [targetIndex]);

  return (
    <div className="reel-window-full">
      <motion.div animate={controls} initial={false}>
        {Array.from({ length: LOOP_COUNT }).flatMap((_, loopIndex) =>
          reel.map((src, i) => (
            <video
              key={`${loopIndex}-${i}`}
              src={src}
              className="video"
              loop
              autoPlay
              muted
              playsInline
            />
          )),
        )}
      </motion.div>
    </div>
  );
}

export default function SlotMachineVideo() {
  const [targetIndex, setTargetIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spineAnim, setSpineAnim] = useState<"idle" | "spin">("idle");

  // 🔥 RWD SCALE
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handlePull = () => {
    if (spinning) return;

    setSpineAnim("spin");

    let nextIndex = Math.floor(Math.random() * reel.length);

    if (nextIndex === targetIndex) {
      nextIndex = (nextIndex + 1) % reel.length;
    }

    setTargetIndex(nextIndex);
    setSpinning(true);

    setTimeout(() => {
      setSpinning(false);
      setSpineAnim("idle");
    }, 2400);
  };

  return (
    <div className="stage" onClick={handlePull}>
      {/* 背景影片 */}
      <video autoPlay muted loop playsInline className="bg-video">
        <source src="background_01.webm" type="video/webm" />
      </video>

      <div className="vignette" />

      {/* 🔥 整台機台（會縮放） */}
      <div className="machine" style={{ transform: `scale(${scale})` }}>
        <SpineBackground animation={spineAnim} onComplete={() => {}} />

        {/* 螢幕 */}
        <div className="screen">
          <div className="glow-frame" />
          <div className="mask-container reels">
            <Reel targetIndex={targetIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
