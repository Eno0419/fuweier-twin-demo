import { useEffect, useRef, useState } from "react";
import { cameras } from "./data";
import { useTwin } from "./store";
export default function CameraFeed({ id }: { id: string }) {
  const c = cameras.find((c) => c.id === id);
  const history = useTwin((s) => s.history);
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (history || !c?.online || !ref.current) return;
    setPaused(false);
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    let timer = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = "#24343a";
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = "#374b51";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(640, 0);
      ctx.lineTo(530, 190);
      ctx.lineTo(110, 190);
      ctx.fill();
      ctx.fillStyle = "#506269";
      ctx.beginPath();
      ctx.moveTo(0, 360);
      ctx.lineTo(640, 360);
      ctx.lineTo(530, 190);
      ctx.lineTo(110, 190);
      ctx.fill();
      ctx.strokeStyle = "#778b8c";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 100 - 60, 360);
        ctx.lineTo(110 + i * 60, 190);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const x = 70 + i * 145;
        ctx.fillStyle = "#90a5a6";
        ctx.fillRect(x, 140, 85, 115);
        ctx.fillStyle = "#30484f";
        ctx.fillRect(x + 8, 150, 69, 28);
        ctx.fillStyle = i === 2 ? "#c99d66" : "#99bc83";
        ctx.fillRect(x + 65, 187, 10, 10);
        ctx.fillStyle = "#1c3036";
        ctx.fillRect(x + 15, 225, 55, 30);
      }
      const px = 120 + (frame % 500) * 0.8;
      ctx.fillStyle = "#d5df9e";
      ctx.beginPath();
      ctx.arc(px, 260, 7, 0, 7);
      ctx.fill();
      ctx.fillRect(px - 6, 267, 12, 24);
      ctx.strokeStyle = "#b9de8b";
      ctx.strokeRect(px - 16, 248, 32, 50);
      ctx.fillStyle = "#e0e6df";
      ctx.font = "14px monospace";
      ctx.fillText("FUWEIER / DEMO CAMERA", 18, 27);
      ctx.fillText(c.id + "  SIMULATED", 18, 337);
      ctx.fillText(
        `00:${String(Math.floor(frame / 15 / 60)).padStart(2, "0")}:${String(Math.floor(frame / 15) % 60).padStart(2, "0")}`,
        520,
        27,
      );
      ctx.fillStyle = "#c7e4a5";
      ctx.beginPath();
      ctx.arc(620, 24, 4, 0, 7);
      ctx.fill();
    };
    draw();
    const stream = canvas.captureStream(15);
    ref.current.srcObject = stream;
    ref.current.play().catch(() => {});
    timer = window.setInterval(draw, 1000 / 15);
    return () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [c, history]);
  if (history)
    return (
      <div className="camera-offline">
        此时段无历史录像<small>录像服务尚未接入</small>
        <button
          className="text-button"
          onClick={() =>
            useTwin.getState().set({ history: false, playing: false })
          }
        >
          返回演示实时查看模拟视频
        </button>
      </div>
    );
  if (!c?.online)
    return (
      <div className="camera-offline">
        摄像头离线
        <br />
        <small>无可用视频 · 请检查来源</small>
      </div>
    );
  return (
    <div className="camera-feed">
      <video
        ref={ref}
        muted
        playsInline
        autoPlay
        aria-label={`${c.name}模拟视频`}
      />
      <span className="video-badge">模拟视频 · 非现场画面</span>
      <button
        className="video-control"
        onClick={() => {
          if (ref.current) {
            if (paused) ref.current.play().catch(() => {});
            else ref.current.pause();
            setPaused(!paused);
          }
        }}
      >
        {paused ? "播放" : "暂停"}
      </button>
    </div>
  );
}
