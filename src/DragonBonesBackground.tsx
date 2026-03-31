import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
// 注意：確保安裝了對應 3.x 數據格式的包，例如 @pixi-spine/loader-3.8 或 pixi-spine
import { Spine } from "pixi-spine";

export default function DragonBonesBackground({
  animation,
}: {
  animation: "idle" | "spin";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spineRef = useRef<Spine | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // 1. 初始化 Application
    const app = new PIXI.Application({
      resizeTo: window,
      backgroundAlpha: 0,
      // 如果是 PixiJS v7，畫布屬性是 view；v8 才是 canvas
      view: undefined,
    } as any);

    ref.current.appendChild(app.view as any);
    appRef.current = app;

    // 2. 載入 Spine 資源 (PixiJS 推薦寫法)
    const loadAssets = async () => {
      try {
        // 直接載入 .skel 或 .json，pixi-spine 會自動去找同名的 .atlas 和 .png
        const resource = await PIXI.Assets.load("/slot_bg.json");

        // 3. 建立 Spine 實例
        // 注意：DragonBones 轉出的數據通常存在 resource.spineData 中
        const spine = new Spine(resource.spineData);

        spine.x = app.screen.width / 2;
        spine.y = app.screen.height / 2;
        spine.scale.set(0.5);

        // 預設動畫
        spine.state.setAnimation(0, "idle", true);

        app.stage.addChild(spine);
        spineRef.current = spine;
      } catch (e) {
        console.error("Spine 加載失敗:", e);
      }
    };

    loadAssets();

    return () => {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };
  }, []);

  // 4. 切換動畫邏輯
  useEffect(() => {
    const spine = spineRef.current;
    if (!spine) return;

    if (animation === "spin") {
      // 清除之前的軌道動畫並播放 spin
      spine.state.setAnimation(0, "spin", false);
      // 播放完自動接回 idle
      spine.state.addAnimation(0, "idle", true, 0);
    } else {
      spine.state.setAnimation(0, "idle", true);
    }
  }, [animation]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none", // 避免擋住 UI 點擊
      }}
    />
  );
}
