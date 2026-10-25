import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function Trend({
  id,
  name,
  minute,
  onSelect,
}: {
  id: string;
  name: string;
  minute: number;
  onSelect?: (minute: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const chart = echarts.init(el.current);
    chart.setOption({
      animation: false,
      backgroundColor: "transparent",
      title: {text: '未接入实时或历史采集值', subtext: name + (id ? ' / ' + id : ''), left: 'center', top: '25%', textStyle: {color:'#465e7b',fontSize:14}, subtextStyle:{color:'#6c819a',fontSize:11}},
      grid: { left: 42, right: 18, top: 24, bottom: 30 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#ffffff",
        borderColor: "#dce5ef",
        textStyle: { color: "#263d58" },
      },
      xAxis: {
        type: "category",
        data: Array.from({ length: 61 }, (_, i) =>
          i === 60 ? "15:00" : `14:${String(i).padStart(2, "0")}`,
        ),
        axisLabel: { color: "#6c819a", interval: 14 },
        axisLine: { lineStyle: { color: "#d6dfeb" } },
      },
      yAxis: {
        type: "value",
        
        axisLabel: { color: "#6c819a" },
        splitLine: { lineStyle: { color: "#e4eaf2" } },
      },
      series: [
        {
          type: "line",
          name,
          data: Array.from({ length: 61 }, () => null),
          showSymbol: false,
          smooth: true,
          lineStyle: { color: "#2668dd", width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#2668dd26" },
              { offset: 1, color: "#2668dd00" },
            ]),
          },
          markLine: {
            symbol: "none",
            label: { color: "#ffb370", formatter: "选定时刻" },
            lineStyle: { color: "#d99360", type: "dashed" },
            data: [
              
              {
                xAxis: Math.min(60, minute),
                label: { formatter: "选定时刻", color: "#637e9c" },
                lineStyle: { color: "#7895b7" },
              },
            ],
          },
        },
      ],
    });
    chart.on("click", (params) => {
      if (typeof params.dataIndex === "number") onSelect?.(params.dataIndex);
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [id, name, minute]);
  return <div ref={el} className="trend-chart" aria-label={`${name}历史趋势（未接入采集值）`} />;
}
