import { useEffect, useRef } from "react";
import { SpinePlayer } from "@esotericsoftware/spine-player";

export default function SpineBackground({
  animation,
  onComplete,
  onLoaded,
}: {
  animation: "idle" | "spin";
  onComplete: () => void;
  onLoaded: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // 🔥 新增：追蹤 Spine 資源是否「真實」下載並初始化完畢
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = new SpinePlayer(containerRef.current, {
      jsonUrl: "slot_bg.json",
      atlasUrl: "slot_bg.atlas",
      animation: "idle",
      alpha: true,
      backgroundColor: "#00000000",
      showControls: false,
      preserveDrawingBuffer: false,
      viewport: { debugRender: false },

      // 🔥 關鍵防護 1：資源載入成功後才標記為 ready
      success: () => {
        isReadyRef.current = true;
        if (onLoaded) onLoaded();
      },
      error: (_player, reason) => {
        console.error("Spine 資源載入失敗:", reason);
        if (onLoaded) onLoaded(); // 就算失敗也呼叫，免得 Loading 卡死
      },
    });

    playerRef.current = player;

    return () => {
      isReadyRef.current = false;
      player.dispose();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;

    // 🔥 關鍵防護 2：如果還沒準備好，就忽略這次播放請求，絕不硬播
    if (!player || !isReadyRef.current) return;

    if (animation === "spin") {
      try {
        // 🔥 關鍵防護 3：加上 try...catch，就算發生意外也絕不讓 React 白畫面崩潰
        player.setAnimation("spin", false);

        setTimeout(() => {
          try {
            // 確保時間到的時候元件還在，沒被卸載
            if (isReadyRef.current) {
              player.setAnimation("idle", true);
              onComplete();
            }
          } catch (e) {
            console.warn("Spine 切回 idle 失敗:", e);
            onComplete(); // 失敗了還是要解除父層的鎖定
          }
        }, 1200);
      } catch (error) {
        console.warn("Spine 尚未就緒或播放失敗:", error);
        onComplete(); // 出錯也要通知父元件，避免機台永遠卡在 spinning 狀態
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation]);
  // 🔥 關鍵防護 4：移除 onComplete 依賴。因為父元件每次渲染都會產生新的 () => {}，
  // 放在依賴陣列裡會導致這個 useEffect 瘋狂重複執行！

  return <div className="spine-container" ref={containerRef} />;
}
