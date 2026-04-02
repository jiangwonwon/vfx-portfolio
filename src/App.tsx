import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import "./app.css";
import SpineBackground from "./SpineBackground";

// 1. 新增對應的縮圖 (請從影片截圖生成這些 .jpg 或 .webp)
const reelData = [
  { video: "videos/video1.webm", poster: "images/poster1.webp" },
  { video: "videos/video2.webm", poster: "images/poster2.webp" },
  { video: "videos/video3.webm", poster: "images/poster3.webp" },
  { video: "videos/video4.webm", poster: "images/poster4.webp" },
  { video: "videos/video5.webm", poster: "images/poster5.webp" },
  { video: "videos/video6.webm", poster: "images/poster6.webp" },
  { video: "videos/video7.webm", poster: "images/poster7.webp" },
  { video: "videos/video8.webm", poster: "images/poster8.webp" },
  { video: "videos/video9.webm", poster: "images/poster9.webp" },
  { video: "videos/video10.webm", poster: "images/poster10.webp" },
  { video: "videos/video11.webm", poster: "images/poster11.webp" },
  { video: "videos/video12.webm", poster: "images/poster12.webp" },
];

const ITEM_HEIGHT = 480;

/**
 * 🚀 1. 單一影片疊加層 (全場唯一一個 Video，永遠不移動，不銷毀)
 */
function OverlayVideo({
  targetIndex,
  spinning,
  isLoaded,
}: {
  targetIndex: number;
  spinning: boolean;
  isLoaded: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 當 targetIndex 改變（即按下旋轉按鈕瞬間），立刻更換影片來源並在背景偷播
  useEffect(() => {
    const video = videoRef.current;
    if (video && isLoaded) {
      // 確保影片播放進度歸零
      video.currentTime = 0;
      video.play().catch((e) => console.warn("自動播放阻擋:", e));
    }
  }, [targetIndex, isLoaded]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: ITEM_HEIGHT,
        zIndex: 10,
        // 🔥 核心魔術：旋轉中完全隱藏，一停下來瞬間出現！
        opacity: spinning ? 0 : 1,
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        src={reelData[targetIndex].video} // 直接綁定目標影片
        className="video"
        loop
        muted
        playsInline
        preload="auto"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

/**
 * 🚀 2. 純圖片輪盤 (超級輕量，隨便怎麼轉都不會卡)
 */
function Reel({ targetIndex }: { targetIndex: number }) {
  const controls = useAnimation();
  const isFirst = useRef(true);

  const TOTAL = reelData.length;
  const LOOP_COUNT = 6;
  const SAFE_OFFSET = TOTAL * Math.floor(LOOP_COUNT / 2);

  useEffect(() => {
    const spinTo = async () => {
      const SPIN_LOOPS = 2;
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

    if (isFirst.current) {
      controls.set({ y: -(SAFE_OFFSET + targetIndex) * ITEM_HEIGHT });
      isFirst.current = false;
      return;
    }

    spinTo();
  }, [targetIndex, controls]); // 依賴項清理乾淨

  return (
    <div className="reel-window-full" style={{ width: "100%", height: "100%" }}>
      <motion.div animate={controls} initial={false}>
        {Array.from({ length: LOOP_COUNT }).flatMap((_, loopIndex) =>
          reelData.map((item, i) => (
            // 🔥 裡面再也沒有 <video>，全部都是輕巧的 <img>
            <div
              key={`${loopIndex}-${i}`}
              style={{ height: ITEM_HEIGHT, width: "100%" }}
            >
              <img
                src={item.poster}
                alt={`poster-${i}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
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
  const [scale, setScale] = useState(1);

  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🚀 Loading 邏輯維持之前優化過的防卡死版本
  useEffect(() => {
    let processed = 0;
    const itemsToPreload = [
      ...reelData.map((r) => r.poster),
      reelData[0].video,
    ];
    const total = itemsToPreload.length;
    let isMounted = true;

    const handleProgress = () => {
      processed++;
      setProgress(Math.floor((processed / total) * 100));
      if (processed === total && isMounted) {
        setTimeout(() => setIsLoaded(true), 300);
      }
    };

    itemsToPreload.forEach((src) => {
      if (src.endsWith(".webm")) {
        const v = document.createElement("video");
        v.preload = "auto";
        v.onloadeddata = handleProgress;
        v.onerror = handleProgress;
        v.src = src;
        v.load();
      } else {
        const img = new Image();
        img.onload = handleProgress;
        img.onerror = handleProgress;
        img.src = src;
      }
    });

    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsLoaded(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // RWD
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
    if (spinning || !isLoaded) return;

    setSpineAnim("spin");

    let nextIndex = Math.floor(Math.random() * reelData.length);
    if (nextIndex === targetIndex) {
      nextIndex = (nextIndex + 1) % reelData.length;
    }

    // 更新 index 時，OverlayVideo 已經在背後開始載入下一支影片了！
    setTargetIndex(nextIndex);
    setSpinning(true);

    setTimeout(() => {
      setSpinning(false);
      setSpineAnim("idle");
    }, 2400);
  };

  return (
    <div className="stage" onClick={handlePull}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="bg-video"
        preload="auto"
      >
        <source src="background_01.webm" type="video/webm" />
      </video>

      <div className="vignette" />

      <div className="machine" style={{ transform: `scale(${scale})` }}>
        <SpineBackground animation={spineAnim} onComplete={() => {}} />

        <div className="screen">
          <div className="glow-frame" />
          {/* 🔥 確保 mask-container 有 position: relative，這樣疊加層才能精準覆蓋 */}
          <div
            className="mask-container reels"
            style={{ position: "relative", overflow: "hidden" }}
          >
            {/* 旋轉的純圖片輪盤 */}
            <Reel targetIndex={targetIndex} />

            {/* 靜態的單一影片疊加層 */}
            <OverlayVideo
              targetIndex={targetIndex}
              spinning={spinning}
              isLoaded={isLoaded}
            />
          </div>
        </div>
      </div>

      {!isLoaded && (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading {progress}%</p>
        </div>
      )}
    </div>
  );
}
