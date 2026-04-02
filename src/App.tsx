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
 * 🚀 1. 單一影片疊加層 (加入嚴格的錯誤捕捉，防止白畫面崩潰)
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    const playVideo = async () => {
      try {
        // 🔥 關鍵防護：檢查影片是否已經載入基本的 Metadata (readyState >= 1)
        // 否則在 GitHub Pages 等慢速網路上設定 currentTime 會拋出錯誤導致白畫面！
        if (video.readyState >= 1) {
          video.currentTime = 0;
        }

        await video.play();
      } catch (error) {
        // 捕捉所有播放錯誤或尚未就緒的錯誤，確保 React 不會崩潰
        console.warn("影片尚未緩衝完成或被瀏覽器阻擋:", error);
      }
    };

    playVideo();
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
        opacity: spinning ? 0 : 1,
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        src={reelData[targetIndex].video}
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

  // 🔥 新增：拆分兩種 Loading 狀態
  const [isMediaLoaded, setIsMediaLoaded] = useState(false); // 影片與圖片
  const [isSpineLoaded, setIsSpineLoaded] = useState(false); // Spine 外框
  const [progress, setProgress] = useState(0);

  // 真正的「完全載入」必須兩者皆 True
  const isAllLoaded = isMediaLoaded && isSpineLoaded;

  // ✅ 預載「縮圖」與「第一支影片」
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
        // 🔥 這裡改成 setIsMediaLoaded
        setTimeout(() => setIsMediaLoaded(true), 300);
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

    // 🛡️ 保底機制稍微拉長一點（因為 Spine 比較大），例如 8 秒
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsMediaLoaded(true);
        setIsSpineLoaded(true); // 時間到，強迫雙雙通關
      }
    }, 8000);

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
    if (spinning || !isAllLoaded) return;

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
        {/* 🔥 把 onLoaded 傳給 SpineBackground */}
        <SpineBackground
          animation={spineAnim}
          onComplete={() => {}}
          onLoaded={() => setIsSpineLoaded(true)}
        />

        <div className="screen">
          <div className="glow-frame" />
          <div
            className="mask-container reels"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <Reel targetIndex={targetIndex} />
            <OverlayVideo
              targetIndex={targetIndex}
              spinning={spinning}
              isLoaded={isAllLoaded}
            />
          </div>
        </div>
      </div>

      {/* 🔥 改用 isAllLoaded 判斷，並且給予更好的文字回饋 */}
      {!isAllLoaded && (
        <div className="loading-screen">
          <div className="spinner" />
          <p>
            {/* 如果圖片影片載好了，就在等 Spine，換個文字告訴使用者 */}
            {isMediaLoaded
              ? "Loading Machine Frame..."
              : `Loading Media ${progress}%`}
          </p>
        </div>
      )}
    </div>
  );
}
