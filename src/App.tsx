import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Expand,
  Factory,
  Focus,
  Home,
  Layers3,
  MapPin,
  Maximize2,
  Network,
  Pause,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
  AlertTriangle,
  Package,
  RotateCcw,
  PanelLeftClose,
  Info,
} from "lucide-react";
import Scene from "./Scene";
import EquipmentDetails from "./EquipmentDetails";
import CameraFeed from "./CameraFeed";
import { useTwin } from "./store";
import {
  modules,
  siteNames,
  equipment,
  cameras,
  people,
  alarms,
  batches,
  floors,
  stateLabel,
  statusLabel,
  type Equipment,
  type ModuleId,
  type ViewMode,
} from "./data";
import { transitionAlarm } from "./domain.mjs";
import modelIndex from "./model-index.json";
const Trend = lazy(() => import("./Charts"));
const ProcessFlow = lazy(() => import("./ProcessFlow"));
const icons = [
  Building2,
  Factory,
  Network,
  Activity,
  AlertTriangle,
  Package,
  ShieldCheck,
];
const modeNames: Record<ViewMode, string> = {
  complete: "建筑完整",
  interior: "去顶查看",
  single: "单层查看",
  explode: "楼层展开",
  structure: "结构查看",
  clip: "剖切查看",
};
const structureNames: Record<string, string> = {
  beam: "梁",
  column: "柱",
  slab: "楼板",
  wall: "墙体",
  stair: "楼梯",
};
type Log = { time: string; text: string };
type AlarmState = { status: string; logs: Log[] };
function readAlarms(): Record<string, AlarmState> {
  try {
    return JSON.parse(localStorage.getItem("fuweier-alarms-v2") || "{}");
  } catch {
    return {};
  }
}
function Badge({ state }: { state: string }) {
  return (
    <span className={`badge ${state}`}>
      {stateLabel[state as keyof typeof stateLabel] ||
        statusLabel[state] ||
        state}
    </span>
  );
}
function SectionTitle({
  children,
  extra,
}: {
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <h3>{children}</h3>
      {extra}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
function EquipmentRow({ e }: { e: Equipment }) {
  const s = useTwin();
  return (
    <button
      className={`object-row ${s.selected === e.id ? "active" : ""}`}
      onClick={() => s.inspect(e.id)}
    >
      <span className={`object-icon ${e.state}`}>
        <Box size={17} />
      </span>
      <span className="row-copy">
        <strong>{e.name}</strong>
        <small>
          {e.tag || "位号未填写"} · {e.floor?.slice(0, 3)} · {e.points.length} 测点
        </small>
      </span>
      <i className={`state-dot ${e.state}`} />
    </button>
  );
}
function Metric({
  label,
  value,
  unit,
  change,
}: {
  label: string;
  value: string;
  unit?: string;
  change?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <div>
        {value}
        <small>{unit}</small>
      </div>
      {change && <em>{change}</em>}
    </div>
  );
}
function saveFile(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function App() {
  const s = useTwin();
  const [clock, setClock] = useState(new Date());
  const [alarmState, setAlarmState] = useState(readAlarms);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [traceId, setTraceId] = useState(batches[0].id);
  const [recordQuery, setRecordQuery] = useState("");
  const [wall, setWall] = useState(false);
  const [guide, setGuide] = useState(-1);
  const [help, setHelp] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [config, setConfig] = useState(false);
  const [equipmentQuery, setEquipmentQuery] = useState("");
  const [pointId, setPointId] = useState("");
  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date());
      const st = useTwin.getState();
      if (st.history && st.playing) st.set({ minute: (st.minute + 1) % 60 });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    localStorage.setItem("fuweier-alarms-v2", JSON.stringify(alarmState));
  }, [alarmState]);
  const selectedEquipment = equipment.find((e) => e.id === s.selected);
  const inspectedEquipment = equipment.find(e => e.id === s.inspection);
  const trendEquipment = selectedEquipment || equipment.find(e=>e.id==='XL1-R130')!;
  const trendPoint = trendEquipment.points.find(p=>p.id===pointId) || trendEquipment.points[0];
  const selectedCamera = cameras.find((e) => e.id === s.selected);
  const selectedPerson = people.find((e) => e.id === s.selected);
  const relatedAlarm = alarms.find((a) => a.equipmentId === s.selected);
  const activeAlarm = relatedAlarm || alarms[0];
  const currentAlarm = alarmState[activeAlarm.id] || {
    status: activeAlarm.status,
    logs: [],
  };
  const filteredEquipment = equipment.filter(
    (e) =>
      (s.line === "all" || e.line === s.line || e.shared) &&
      (s.site === "all" || e.site === s.site) &&
      (s.floor === "all" || s.mode !== "single" || e.floor === s.floor) &&
      `${e.name} ${e.tag} ${e.id} ${e.process} ${e.points.map(p=>`${p.code} ${p.name}`).join(" ")}`.toLowerCase().includes(equipmentQuery.toLowerCase()),
  );
  const record = batches.find((b) => b.id === traceId)!;
  const visibleRecords = batches.filter((b) =>
    [b.id, b.batch, b.bucket, b.task].some((v) =>
      v.toLowerCase().includes(recordQuery.toLowerCase()),
    ),
  );
  const validPeople = people.filter(
    (p) =>
      p.state === "valid" &&
      (s.site === "all" || p.site === s.site) &&
      (s.floor === "all" || p.floor === s.floor),
  );
  const scopedCameras = cameras.filter(
    (c) =>
      (s.site === "all" || c.site === s.site) &&
      (s.floor === "all" || c.floor === s.floor),
  );
  const scopedPeople = people.filter(
    (p) =>
      (s.site === "all" || p.site === s.site) &&
      (s.floor === "all" || p.floor === s.floor),
  );
  const searchResults = useMemo(() => {
    if (!s.query.trim()) return [];
    const q = s.query.toLowerCase();
    return [...equipment, ...cameras, ...(s.role === "manager" ? [] : people)]
      .filter((e) => `${e.name} ${e.id} ${"tag" in e ? e.tag : ""} ${"points" in e ? e.points.map(p=>`${p.code} ${p.name}`).join(" ") : ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [s.query, s.role]);
  const buildingMatches = Object.entries(siteNames)
    .filter(([, name]) => s.query.trim() && name.includes(s.query))
    .slice(0, 4);
  const openCount = alarms.filter(
    (a) => (alarmState[a.id]?.status || a.status) !== "closed",
  ).length;
  const switchModule = (id: ModuleId) => {
    s.set({
      module: id,
      query: "",
      ...(id === "security"
        ? { layers: { ...s.layers, cameras: true, people: true } }
        : {}),
    });
  };
  const showAlarm = (id: string) => {
    const a = alarms.find((a) => a.id === id)!;
    s.locate(a.equipmentId, "alarms");
    setNote("");
  };
  const action = (a: string) => {
    if (s.role === "manager") {
      setNotice("管理概况角色仅可查看，请切换获授权的演示角色。");
      return;
    }
    const next = transitionAlarm(currentAlarm.status, a);
    if (next === currentAlarm.status) return;
    const label = {
      confirm: "确认异常",
      recover: "记录恢复",
      close: "关闭事件",
    }[a];
    setAlarmState({
      ...alarmState,
      [activeAlarm.id]: {
        status: next,
        logs: [
          ...currentAlarm.logs,
          {
            time: clock.toLocaleTimeString("zh-CN", { hour12: false }),
            text: `${label}${note ? " · " + note : ""}`,
          },
        ],
      },
    });
    setNote("");
    setNotice("演示处置记录已保存到当前浏览器");
  };
  const addNote = () => {
    if (!note.trim() || s.role === "manager") return;
    setAlarmState({
      ...alarmState,
      [activeAlarm.id]: {
        ...currentAlarm,
        logs: [
          ...currentAlarm.logs,
          {
            time: clock.toLocaleTimeString("zh-CN", { hour12: false }),
            text: note.trim(),
          },
        ],
      },
    });
    setNote("");
  };
  const walkthrough = (step: number) => {
    setGuide(step);
    if (step === 0) {
      s.home();
      s.set({ module: "overview" });
    }
    if (step === 1) {
      s.goSite("P1_TOWER");
      s.set({ mode: "explode", module: "production" });
    }
    if (step === 2) showAlarm("AL-001");
    if (step === 3) {
      s.locate("CAM-01", "security");
    }
    if (step === 4) {
      s.set({ module: "trace", history: true, minute: 42, playing: false });
      s.locate("XL1-R130", "trace");
    }
  };
  return (
    <div
      className={`app ${!leftOpen ? "left-collapsed" : ""} ${s.selected ? "detail-open" : ""}`}
      data-module={s.module}
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Factory size={25} />
          </div>
          <div>
            <strong>
              富威尔<span>FUWEIER</span><span className="title-demo">展示 DEMO</span>
            </strong>
            <small className="title-disclaimer">数字孪生运营中心 · 仅展示业务逻辑，不代表真实原型和最终画面</small>
          </div>
        </div>
        <div className="header-actions">
          <span className="demo-tag">DEMO · 演示数据</span>
          <time>
            {clock.toLocaleTimeString("zh-CN", { hour12: false })}
            <small>{clock.toLocaleDateString("zh-CN")}</small>
          </time>
          <select
            aria-label="演示角色"
            value={s.role}
            onChange={(e) => {
              s.set({
                role: e.target.value as typeof s.role,
                selected: s.selected?.startsWith("P-") ? null : s.selected,
              });
            }}
          >
            <option value="security">安防值班员</option>
            <option value="operator">生产操作员</option>
            <option value="manager">管理概况</option>
          </select>
          <button
            className="icon-button"
            title="使用说明"
            onClick={() => setHelp(true)}
          >
            <Info size={18} />
          </button>
        </div>
      </header>
      <nav className="main-nav">
        {modules.map((m, i) => {
          const Icon = icons[i];
          return (
            <button
              key={m.id}
              className={s.module === m.id ? "active" : ""}
              onClick={() => switchModule(m.id)}
            >
              <Icon size={17} />
              {m.name}
              {m.id === "alarms" && <b>{openCount}</b>}
            </button>
          );
        })}
        <button className="tour-button" onClick={() => walkthrough(0)}>
          <Play size={14} />
          演示导览
        </button>
      </nav>
      <aside className="left-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              WORKSPACE / {modules.find((m) => m.id === s.module)?.en}
            </span>
            <h2>
              {s.module === "overview"
                ? "空间导航"
                : modules.find((m) => m.id === s.module)?.name}
            </h2>
          </div>
          <button
            className="icon-button"
            title="收起导航"
            onClick={() => setLeftOpen(false)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="搜索设备、摄像头、人员或建筑"
            placeholder="搜索设备、摄像头、建筑…"
            value={s.query}
            onChange={(e) => s.set({ query: e.target.value })}
          />
          {s.query && (
            <button onClick={() => s.set({ query: "" })}>
              <X size={14} />
            </button>
          )}
        </div>
        {s.query ? (
          <div className="search-results">
            <small>全厂搜索结果</small>
            {buildingMatches.map(([id, name]) => (
              <button
                className="object-row"
                key={id}
                onClick={() => {
                  s.goSite(id);
                  s.set({ query: "" });
                }}
              >
                <Building2 size={17} />
                {name}
                <ChevronRight size={15} />
              </button>
            ))}
            {searchResults.map((e) => (
              <button
                className="object-row"
                key={e.id}
                onClick={() => {
                  s.locate(
                    e.id,
                    e.id.startsWith("CAM") || e.id.startsWith("P-")
                      ? "security"
                      : s.module,
                  );
                  s.set({ query: "" });
                }}
              >
                <MapPin size={17} />
                <span className="row-copy">
                  <strong>{e.name}</strong>
                  <small>{e.id}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
            {!buildingMatches.length && !searchResults.length && (
              <Empty>没有匹配对象</Empty>
            )}
          </div>
        ) : (
          <div className="left-scroll">
            {s.module === "overview" ? (
              <>
                <button
                  className={`campus-root ${s.site === "all" ? "active" : ""}`}
                  onClick={s.home}
                >
                  <Building2 size={19} />
                  <span>
                    富威尔厂区<small>CAD 空间草稿 · 现场待核实</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
                <SectionTitle extra={<span>重点区域</span>}>
                  建筑与设施
                </SectionTitle>
                {[
                  "P1_TOWER",
                  "P1_HALL",
                  "P2_HALL",
                  "WAREHOUSE",
                  "POLYMER_MAIN",
                  "POWER",
                  "OFFICE",
                  "PUMP",
                ].map((id, i) => (
                  <div key={id}>
                    <button
                      className={`building-row ${s.site === id ? "active" : ""}`}
                      onClick={() => s.goSite(id)}
                    >
                      <span className="building-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        {siteNames[id]}
                        {id === "P1_TOWER" && (
                          <small>848 构件 / 7 个标高</small>
                        )}
                      </span>
                      {id === "P1_TOWER" ? (
                        <span className="mini-tag">可分层</span>
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                    {s.site === id && id === "P1_TOWER" && (
                      <div className="floor-tree">
                        {[...floors].reverse().map((f) => (
                          <button
                            key={f.id}
                            className={s.floor === f.id ? "active" : ""}
                            onClick={() =>
                              s.set({
                                floor: f.id,
                                mode: "single",
                                selected: null,
                              })
                            }
                          >
                            <Layers3 size={13} />
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="notice-card">
                  <Layers3 size={18} />
                  <strong>从空间进入业务</strong>
                  <p>
                    点击建筑或搜索对象，自动定位到对应区域。前纺塔楼支持分层和结构查看。
                  </p>
                </div>
              </>
            ) : null}
            {["production", "monitor", "process"].includes(s.module) && (
              <>
                <div className="segmented">
                  {[
                    ["all", "全部"],
                    ["1", "卫材 1#"],
                    ["2", "卫材 2#"],
                  ].map(([id, name]) => (
                    <button
                      key={id}
                      className={s.line === id ? "active" : ""}
                      onClick={() => {
                        s.set({ line: id });
                        if (s.site !== "all") {
                          s.home();
                          s.set({ line: id });
                        }
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <SectionTitle
                  extra={<span>{filteredEquipment.length} 条</span>}
                >
                  当前空间设备
                </SectionTitle>
                {s.site !== "all" && (
                  <button className="text-button" onClick={s.home}>
                    清除空间筛选 · 查看全厂
                  </button>
                )}
                <label className="catalog-search"><Search size={14}/><input aria-label="筛选设备清单" placeholder="设备、位号、工序或测点…" value={equipmentQuery} onChange={e=>setEquipmentQuery(e.target.value)}/></label>
                {filteredEquipment.map((e) => (
                  <EquipmentRow key={e.id} e={e} />
                ))}
                {!filteredEquipment.length && (
                  <Empty>该区域暂无已绑定的演示设备</Empty>
                )}
                <div className="notice-card">
                  <Info size={17} />
                  <p>原表 232 条设备记录、533 条测点记录，全部布置在前纺结构塔楼。每条为原表设备或设备组，不等同于单台数量。</p>
                </div>
              </>
            )}
            {s.module === "alarms" && (
              <>
                <div className="summary-strip">
                  <strong>{openCount}</strong>
                  <span>待跟进事件</span>
                  <small>全厂范围</small>
                </div>
                {alarms.map((a) => {
                  const st = alarmState[a.id]?.status || a.status;
                  return (
                    <button
                      key={a.id}
                      className={`alarm-row ${s.selected === a.equipmentId ? "active" : ""}`}
                      onClick={() => showAlarm(a.id)}
                    >
                      <div>
                        <span className={`severity ${a.severity}`}>
                          {a.severity === "high"
                            ? "高"
                            : a.severity === "medium"
                              ? "中"
                              : "低"}
                        </span>
                        <small>{a.time}</small>
                        <Badge state={st} />
                      </div>
                      <strong>{a.title}</strong>
                      <p>
                        {equipment.find((e) => e.id === a.equipmentId)?.name}
                      </p>
                      <span className="alarm-location">
                        <MapPin size={12} />
                        {
                          siteNames[
                            equipment.find((e) => e.id === a.equipmentId)!.site
                          ]
                        }
                        <ArrowUpRight size={14} />
                      </span>
                    </button>
                  );
                })}
                <div className="notice-card">
                  <p>
                    设备状态与数据质量分别呈现。确认事件不会自动改变设备状态。
                  </p>
                </div>
              </>
            )}
            {s.module === "trace" && (
              <>
                <SectionTitle>生产业务关联查询</SectionTitle>
                <div className="search-box inline">
                  <Search size={14} />
                  <input
                    aria-label="查询包号批次桶号任务"
                    placeholder="包号 / 批次 / 桶号 / 任务"
                    value={recordQuery}
                    onChange={(e) => setRecordQuery(e.target.value)}
                  />
                </div>
                {visibleRecords.map((b) => (
                  <button
                    key={b.id}
                    className={`record-card ${traceId === b.id ? "active" : ""}`}
                    onClick={() => {
                      setTraceId(b.id);
                      s.set({
                        history: true,
                        playing: false,
                        minute: b.line === "1" ? 42 : 20,
                      });
                      s.locate(b.equipmentIds.at(-1)!, "trace");
                    }}
                  >
                    <Package size={21} />
                    <strong>{b.id}</strong>
                    <span>{b.batch}</span>
                    <small>
                      卫材 {b.line}#线 · {b.quality}
                    </small>
                  </button>
                ))}
                {!visibleRecords.length && <Empty>未找到业务记录</Empty>}
                <div className="notice-card">
                  <p>
                    示例数据可按包号、批次、桶号或任务查询。选择记录后带入生产时段。
                  </p>
                </div>
              </>
            )}
            {s.module === "security" && (
              <>
                <div className="security-summary">
                  <Metric
                    label="当前有效定位人员"
                    value={String(validPeople.length)}
                    unit="人"
                  />
                  <Metric
                    label="在线摄像头"
                    value={String(scopedCameras.filter((c) => c.online).length)}
                    unit={`/${scopedCameras.length}`}
                  />
                </div>
                <button className="wide-button" onClick={() => setWall(true)}>
                  <Expand size={15} />
                  打开多画面监控
                </button>
                <SectionTitle extra={<span>按当前空间</span>}>
                  摄像头
                </SectionTitle>
                {scopedCameras.map((c) => (
                  <button
                    className={`object-row ${s.selected === c.id ? "active" : ""}`}
                    key={c.id}
                    onClick={() => s.locate(c.id, "security")}
                  >
                    <Camera size={17} />
                    <span className="row-copy">
                      <strong>{c.name}</strong>
                      <small>
                        {c.id} · {c.online ? "在线" : "离线"}
                      </small>
                    </span>
                    <i
                      className={`state-dot ${c.online ? "running" : "stale"}`}
                    />
                  </button>
                ))}
                <SectionTitle>人员分布</SectionTitle>
                {s.role === "manager" ? (
                  <Empty>管理概况仅展示人数。个人位置详情需授权角色。</Empty>
                ) : (
                  scopedPeople.map((p) => (
                    <button
                      className="object-row"
                      key={p.id}
                      onClick={() => s.locate(p.id, "security")}
                    >
                      <Users size={16} />
                      <span className="row-copy">
                        <strong>{p.name}</strong>
                        <small>
                          {p.team} ·{" "}
                          {p.state === "valid"
                            ? "位置有效"
                            : p.state === "stale"
                              ? "位置过期"
                              : "离线"}
                        </small>
                      </span>
                    </button>
                  ))
                )}
                <p className="muted small">
                  统计仅涵盖有效定位对象，不能作为厂区实际总人数。
                </p>
                {s.site !== "all" && (
                  <button className="text-button" onClick={s.home}>
                    查看全厂安防点位
                  </button>
                )}
              </>
            )}
          </div>
        )}
        <div className="left-bottom">
          <span className="live-dot" /> 设备明细表 v1.5 <span>232 / 533</span>
        </div>
      </aside>
      <main className="scene-area">
        <div className="scene-canvas">
          <Scene />
        </div>
        <div className="scene-top">
          <div className="breadcrumbs">
            {!leftOpen && (
              <button title="展开导航" onClick={() => setLeftOpen(true)}>
                <Layers3 size={16} />
              </button>
            )}
            <button onClick={s.home}>
              <Home size={14} />
              厂区
            </button>
            {s.site !== "all" && (
              <>
                <ChevronRight size={13} />
                <button onClick={() => s.goSite(s.site)}>
                  {siteNames[s.site] || s.site}
                </button>
              </>
            )}
            {s.floor !== "all" && (
              <>
                <ChevronRight size={13} />
                <span>{floors.find((f) => f.id === s.floor)?.label}</span>
              </>
            )}
          </div>
          <button
            className="scene-chip"
            onClick={() => {
              s.home();
              setGuide(-1);
            }}
          >
            <RotateCcw size={14} />
            全厂视角
          </button>
        </div>
        <div className="scene-title">
          <span className="eyebrow">
            {s.site === "all"
              ? "FUWEIER INDUSTRIAL CAMPUS"
              : "SPATIAL EXPLORER"}
          </span>
          <h1>
            {s.site === "all" ? "厂区数字孪生" : siteNames[s.site] || s.site}
          </h1>
          <p>
            {s.site === "all"
              ? "全厂空间总览 · 选择建筑进入现场"
              : s.site === "P1_TOWER"
                ? "CAD 建筑结构 · 楼层标高导航"
                : "建筑外形来自 CAD · 室内设备为示意布置"}
          </p>
        </div>
        {s.site !== "all" && (
          <div className="view-controls">
            {(s.site === "P1_TOWER"
              ? Object.keys(modeNames)
              : ["complete", "interior", "clip"]
            ).map((key) => (
              <button
                key={key}
                className={s.mode === key ? "active" : ""}
                onClick={() =>
                  s.set({
                    mode: key as ViewMode,
                    selected: null,
                    floor:
                      key === "single"
                        ? s.floor === "all"
                          ? floors[0].id
                          : s.floor
                        : "all",
                  })
                }
              >
                {modeNames[key as ViewMode]}
              </button>
            ))}
          </div>
        )}
        {s.site === "P1_TOWER" && (
          <div className="floor-selector">
            <span>标高</span>
            {[...floors].reverse().map((f) => (
              <button
                key={f.id}
                title={f.label}
                className={s.floor === f.id ? "active" : ""}
                onClick={() =>
                  s.set({ mode: "single", floor: f.id, selected: null })
                }
              >
                {f.short}
                <small>{f.elevation}m</small>
              </button>
            ))}
            <button
              className={s.floor === "all" ? "active" : ""}
              onClick={() =>
                s.set({ floor: "all", mode: "structure", selected: null })
              }
            >
              全部
            </button>
          </div>
        )}
        {s.mode === "clip" && (
          <div className="clip-control">
            <span>水平剖切 {s.clip.toFixed(1)}m</span>
            <input
              aria-label="剖切高度"
              type="range"
              min="0"
              max="35"
              step=".5"
              value={s.clip}
              onChange={(e) => s.set({ clip: +e.target.value })}
            />
          </div>
        )}
        {s.site === "P1_TOWER" &&
          ["structure", "single", "explode"].includes(s.mode) && (
            <div className="structure-control">
              {Object.keys(s.structure).map((k) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    checked={s.structure[k]}
                    onChange={(e) =>
                      s.set({
                        structure: { ...s.structure, [k]: e.target.checked },
                      })
                    }
                  />
                  {structureNames[k]}
                </label>
              ))}
            </div>
          )}
        <div className="scene-tools">
          <button
            title="聚焦当前对象"
            onClick={() => s.set({ focus: s.focus + 1 })}
          >
            <Focus size={19} />
          </button>
          <button
            title="返回建筑"
            onClick={() => (s.site !== "all" ? s.goSite(s.site) : s.home())}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            title="切换标签"
            className={s.layers.labels ? "active" : ""}
            onClick={() =>
              s.set({ layers: { ...s.layers, labels: !s.layers.labels } })
            }
          >
            <MapPin size={18} />
          </button>
          <button title="点位配置与导出" onClick={() => setConfig(true)}>
            <Settings2 size={18} />
          </button>
        </div>
        <div className="north-indicator">
          <Compass size={30} />
          <span>视角</span>
        </div>
        <div className="scene-bottom">
          <div className="layer-pills">
            {[
              ["equipment", "设备"],
              ["cameras", "摄像头"],
              ["people", "人员"],
            ].map(([k, label]) => (
              <button
                key={k}
                className={s.layers[k as keyof typeof s.layers] ? "active" : ""}
                onClick={() =>
                  s.set({
                    layers: {
                      ...s.layers,
                      [k]: !s.layers[k as keyof typeof s.layers],
                    },
                  })
                }
              >
                <i />
                {label}
              </button>
            ))}
          </div>
          <span className="model-note">CAD 草稿 / 示意点位 / 未经现场核验</span>
        </div>
        {guide >= 0 && (
          <div className="guide">
            <span>导览 {guide + 1} / 5</span>
            <strong>
              {
                [
                  "从厂区看全局",
                  "展开楼层，理解内部结构",
                  "从异常进入设备现场",
                  "查看关联视频与人员",
                  "沿成品包追溯生产过程",
                ][guide]
              }
            </strong>
            <button
              onClick={() =>
                guide < 4 ? walkthrough(guide + 1) : setGuide(-1)
              }
            >
              {guide < 4 ? "下一步" : "完成导览"}
              <ArrowRight size={15} />
            </button>
            <button
              title="结束导览"
              className="icon-button"
              onClick={() => setGuide(-1)}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>
      <aside className="right-panel">
        <div className="right-scroll">
          {!s.selected && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">OPERATIONS AT A GLANCE</span>
                  <h2>{s.site === "all" ? "运行概况" : "区域概况"}</h2>
                </div>
                <span className="mini-tag">模拟</span>
              </div>
              <div className="metrics-grid">
                <Metric
                  label="设备记录"
                  value={String(
                    s.site === "all"
                      ? equipment.length
                      : equipment.filter((e) => e.site === s.site).length,
                  )}
                  unit="条"
                />
                <Metric
                  label="待跟进异常"
                  value={String(
                    s.site === "all"
                      ? openCount
                      : alarms.filter(
                          (a) =>
                            equipment.find((e) => e.id === a.equipmentId)
                              ?.site === s.site &&
                            (alarmState[a.id]?.status || a.status) !== "closed",
                        ).length,
                  )}
                  unit="项"
                />
                <Metric
                  label="今日产量"
                  value={s.site === "all" ? "128.6" : "64.2"}
                  unit="t"
                  change="演示生产统计"
                />
                <Metric
                  label="当前有效定位"
                  value={String(validPeople.length)}
                  unit="人"
                  change="不含过期与离线"
                />
              </div>
              <SectionTitle extra={<span>演示计划</span>}>
                生产进度
              </SectionTitle>
              {[
                ["卫材 1#线", 78, "#2668dd"],
                ["卫材 2#线", 64, "#24918c"],
              ].map(([name, v, color]) => (
                <div className="progress-item" key={name}>
                  <div>
                    <span>{name}</span>
                    <strong>{v}%</strong>
                  </div>
                  <div className="progress-track">
                    <i
                      style={{ width: `${v}%`, background: color as string }}
                    />
                  </div>
                  <small>已完成 / 当日演示计划</small>
                </div>
              ))}
              <SectionTitle
                extra={
                  <button
                    className="text-button"
                    onClick={() => switchModule("alarms")}
                  >
                    全部 <ArrowUpRight size={12} />
                  </button>
                }
              >
                重点关注
              </SectionTitle>
              {alarms.slice(0, 2).map((a) => (
                <button
                  key={a.id}
                  className="attention-card"
                  onClick={() => showAlarm(a.id)}
                >
                  <AlertTriangle size={17} />
                  <span>
                    <strong>{a.title}</strong>
                    <small>{a.time} · 点击定位现场</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
              <SectionTitle>空间资产</SectionTitle>
              <div className="asset-info">
                <span>厂区模型</span>
                <strong>6.13 MB</strong>
                <span>三角面数</span>
                <strong>91,444</strong>
                <span>塔楼结构构件</span>
                <strong>848</strong>
                <span>可用标高层级</span>
                <strong>7</strong>
              </div>
              <button
                className="wide-button accent"
                onClick={() => {
                  s.goSite("P1_TOWER");
                  s.set({ mode: "explode" });
                }}
              >
                <Layers3 size={16} />
                查看楼层结构
                <ArrowUpRight size={15} />
              </button>
            </>
          )}
          {selectedEquipment && (
            <>
              <div className="detail-title">
                <div>
                  <span className="eyebrow">
                    EQUIPMENT / {selectedEquipment.id}
                  </span>
                  <h2>{selectedEquipment.name}</h2>
                </div>
                <button
                  className="icon-button"
                  title="关闭详情"
                  onClick={() => s.set({ selected: null })}
                >
                  <X size={17} />
                </button>
              </div>
              <div className="detail-meta">
                <Badge state={selectedEquipment.state} />
                <span className="mini-tag">原表设备 / 示意外形</span>
              </div>
              <div className="asset-info">
                <span>所属区域</span>
                <strong>{siteNames[selectedEquipment.site]}</strong>
                <span>楼层标高</span>
                <strong>
                  {selectedEquipment.floor
                    ? floors.find((f) => f.id === selectedEquipment.floor)
                        ?.label
                    : "地面层（示意）"}
                </strong>
                <span>所属工序</span>
                <strong>{selectedEquipment.process}</strong>
                <span>服务产线</span>
                <strong>
                  {selectedEquipment.shared
                    ? "卫材 1# / 2# 共用"
                    : `卫材 ${selectedEquipment.line}#线`}
                </strong>
                <span>数据时间</span>
                <strong>
                  {s.history
                    ? `历史 · 14:${String(s.minute % 60).padStart(2, "0")}`
                    : "演示实时 · " +
                      clock.toLocaleTimeString("zh-CN", { hour12: false })}
                </strong>
              </div>
              <div className="catalog-summary"><strong>{selectedEquipment.points.length} 条测点</strong><p>位号：{selectedEquipment.tag || '原表未填写'}<br/>数量：{selectedEquipment.quantity || '原表未填写'}</p><small>来源：{selectedEquipment.sourceSheet}，第 {selectedEquipment.sourceRow} 行起。采集值尚未接入。</small><button className="wide-button accent" onClick={()=>s.inspect(selectedEquipment.id)}>查看完整设备与测点详情</button><button className="wide-button" onClick={()=>s.locate(selectedEquipment.id)}><Focus size={14}/>定位此设备</button></div>
              <div className="detail-actions">
                <button onClick={() => s.set({ module: "monitor" })}>
                  <Activity size={14} />
                  趋势
                </button>
                <button onClick={() => s.set({ module: "process" })}>
                  <Network size={14} />
                  工艺
                </button>
                <button
                  onClick={() => {
                    setTraceId(
                      selectedEquipment.line === "2"
                        ? batches[1].id
                        : batches[0].id,
                    );
                    s.set({ module: "trace" });
                  }}
                >
                  <Package size={14} />
                  记录
                </button>
              </div>
              {s.module === "alarms" && relatedAlarm ? (
                <>
                  <SectionTitle extra={<Badge state={currentAlarm.status} />}>
                    事件处置 · {activeAlarm.id}
                  </SectionTitle>
                  <p className="detail-description">
                    {activeAlarm.description}
                  </p>
                  <div className="source-line">来源：{activeAlarm.source}</div>
                  <textarea
                    aria-label="处置备注"
                    placeholder="填写核查情况或处置备注…"
                    value={note}
                    disabled={s.role === "manager"}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="alarm-actions">
                    <button
                      disabled={!note.trim() || s.role === "manager"}
                      onClick={addNote}
                    >
                      保存备注
                    </button>
                    {currentAlarm.status === "pending" && (
                      <button
                        disabled={s.role === "manager"}
                        className="accent"
                        onClick={() => action("confirm")}
                      >
                        确认异常
                      </button>
                    )}
                    {currentAlarm.status === "confirmed" && (
                      <button
                        disabled={s.role === "manager"}
                        className="accent"
                        onClick={() => action("recover")}
                      >
                        记录恢复
                      </button>
                    )}
                    {currentAlarm.status === "recovered" && (
                      <button
                        disabled={s.role === "manager"}
                        className="accent"
                        onClick={() => action("close")}
                      >
                        关闭事件
                      </button>
                    )}
                  </div>
                  <div className="event-log">
                    <p>
                      <i />
                      {activeAlarm.time} · 异常产生
                    </p>
                    {currentAlarm.logs.map((log, i) => (
                      <p key={i}>
                        <i />
                        {log.time} · {log.text}
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                relatedAlarm && (
                  <button
                    className="attention-card"
                    onClick={() => showAlarm(relatedAlarm.id)}
                  >
                    <AlertTriangle size={16} />
                    <span>{relatedAlarm.title}</span>
                    <ArrowUpRight size={15} />
                  </button>
                )
              )}
              <SectionTitle>关联现场视频</SectionTitle>
              {s.role === "manager" ? (
                <Empty>当前角色仅查看管理概况</Empty>
              ) : cameras.filter((c) => c.covers.includes(selectedEquipment.id))
                  .length ? (
                cameras
                  .filter((c) => c.covers.includes(selectedEquipment.id))
                  .map((c) => (
                    <div key={c.id}>
                      <CameraFeed id={c.id} />
                      <button
                        className="text-button"
                        onClick={() => s.locate(c.id, "security")}
                      >
                        {c.name}
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  ))
              ) : (
                <Empty>未配置可覆盖此设备的摄像头</Empty>
              )}
              <SectionTitle>
                {s.history ? "历史人员位置" : "同区域有效定位人员"}
              </SectionTitle>
              {s.history ? (
                <Empty>未接入历史定位记录，当前时段不展示人员位置。</Empty>
              ) : s.role === "manager" ? (
                <p className="muted">{validPeople.length} 人 · 个人详情受限</p>
              ) : (
                validPeople.map((p) => (
                  <button
                    className="person-inline"
                    key={p.id}
                    onClick={() => s.locate(p.id, "security")}
                  >
                    <Users size={14} />
                    {p.name}
                    <small>{p.role}</small>
                  </button>
                ))
              )}
              <p className="muted small">
                位置接近不代表具备处置资格，请结合岗位联系。
              </p>
            </>
          )}
          {selectedCamera && (
            <>
              <div className="detail-title">
                <div>
                  <span className="eyebrow">CAMERA / {selectedCamera.id}</span>
                  <h2>{selectedCamera.name}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => s.set({ selected: null })}
                  title="关闭详情"
                >
                  <X size={16} />
                </button>
              </div>
              {s.role === "manager" ? (
                <Empty>视频查看需要授权角色</Empty>
              ) : (
                <CameraFeed id={selectedCamera.id} />
              )}
              <div className="asset-info">
                <span>连接状态</span>
                <strong>
                  {selectedCamera.online ? "在线（模拟）" : "离线"}
                </strong>
                <span>所属区域</span>
                <strong>{siteNames[selectedCamera.site]}</strong>
                <span>安装楼层</span>
                <strong>{selectedCamera.floor?.slice(0, 3) || "地面层"}</strong>
                <span>录像回放</span>
                <strong>未接入录像服务</strong>
                <span>覆盖关系</span>
                <strong>演示配置 · 待现场确认</strong>
              </div>
              <SectionTitle>关联覆盖对象</SectionTitle>
              {selectedCamera.covers.map((id) => (
                <EquipmentRow
                  key={id}
                  e={equipment.find((e) => e.id === id)!}
                />
              ))}
              {!selectedCamera.covers.length && (
                <Empty>暂无已确认的覆盖对象</Empty>
              )}
              <button className="wide-button" onClick={() => setWall(true)}>
                <Expand size={15} />
                多画面查看
              </button>
              <div className="notice-card">
                <p>
                  当前视频为浏览器生成的动态模拟画面。正式接入需由视频服务提供已授权的浏览器播放地址。
                </p>
              </div>
            </>
          )}
          {selectedPerson && (
            <>
              <div className="detail-title">
                <div>
                  <span className="eyebrow">
                    PERSONNEL / {selectedPerson.id}
                  </span>
                  <h2>
                    {s.role === "manager"
                      ? "人员位置受限"
                      : selectedPerson.name}
                  </h2>
                </div>
                <button
                  className="icon-button"
                  title="关闭详情"
                  onClick={() => s.set({ selected: null })}
                >
                  <X size={16} />
                </button>
              </div>
              {s.role === "manager" ? (
                <Empty>请使用授权角色查看个人详情</Empty>
              ) : (
                <>
                  <div className="person-avatar">
                    <Users size={36} />
                  </div>
                  <div className="asset-info">
                    <span>岗位</span>
                    <strong>{selectedPerson.role}</strong>
                    <span>班组</span>
                    <strong>{selectedPerson.team}</strong>
                    <span>区域</span>
                    <strong>{siteNames[selectedPerson.site]}</strong>
                    <span>楼层</span>
                    <strong>
                      {selectedPerson.floor?.slice(0, 3) || "地面层"}
                    </strong>
                    <span>定位状态</span>
                    <strong>
                      {selectedPerson.state === "valid"
                        ? "有效（模拟）"
                        : selectedPerson.state === "stale"
                          ? "位置过期"
                          : "离线"}
                    </strong>
                    <span>最近更新时间</span>
                    <strong>
                      {selectedPerson.state === "valid"
                        ? "刚刚（模拟）"
                        : "14:32:00（演示时段）"}
                    </strong>
                  </div>
                  <div className="notice-card">
                    <p>
                      人员信息为匿名演示对象。此定位清单不能代替现场清点或撤离确认。
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </aside>
      <section className="bottom-panel">
        {s.module === "process" ? (
          <>
            <div className="bottom-heading">
              <strong>
                <Network size={16} />
                卫材 {s.line === "2" ? "2" : "1"}# 工艺路线
              </strong>
              <span>
                工序名称及设备数量依据原表 · 路线顺序为演示 · 点击工序定位
              </span>
            </div>
            <div className="flow-container">
              <Suspense fallback={<Empty>加载工艺图…</Empty>}>
                <ProcessFlow />
              </Suspense>
            </div>
          </>
        ) : s.module === "monitor" || s.module === "alarms" ? (
          <>
            <div className="bottom-heading">
              <strong>
                <Activity size={16} />
                {trendEquipment.name} · 测点趋势
              </strong>
              <select aria-label="趋势测点" value={trendPoint?.id || ""} onChange={e=>setPointId(e.target.value)}>{trendEquipment.points.map(p=><option value={p.id} key={p.id}>{p.name} · {p.code || "编码待补充"}</option>)}</select>
              <button
                className="text-button"
                onClick={() => s.set({ history: !s.history, playing: false })}
              >
                {s.history ? "返回实时" : "查看历史"}
              </button>
            </div>
            <Suspense fallback={<Empty>加载趋势…</Empty>}>
              <Trend
                id={trendPoint?.code || ""}
                name={trendPoint?.name || "原表未列测点"}
                minute={s.minute}
                onSelect={(m) =>
                  s.set({ minute: m, history: true, playing: false })
                }
              />
            </Suspense>
          </>
        ) : s.module === "trace" ? (
          <>
            <div className="bottom-heading">
              <strong>
                <Package size={16} />
                {record.id}
              </strong>
              <span>
                生产时段 {record.time} · 检验 {record.quality} · 演示关联
              </span>
            </div>
            <div className="trace-chain">
              <div className="trace-node">
                <small>成品包 / 批次</small>
                <strong>{record.batch}</strong>
                <span>{record.quality}</span>
              </div>
              <ArrowLeft size={18} />
              <div className={`trace-node ${record.gap ? "gap" : ""}`}>
                <small>投用桶次</small>
                <strong>{record.bucket}</strong>
                <span>
                  {record.gap ? "前纺交接记录缺失" : "交接记录已确认（模拟）"}
                </span>
              </div>
              <ArrowLeft size={18} />
              <div className="trace-devices">
                {record.equipmentIds.map((id) => (
                  <button
                    className={s.selected === id ? "active" : ""}
                    key={id}
                    onClick={() => {
                      s.locate(id, "trace");
                      s.set({
                        history: true,
                        minute: record.line === "1" ? 42 : 20,
                        playing: false,
                      });
                    }}
                  >
                    {equipment.find((e) => e.id === id)?.name}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="overview-bottom">
            <div>
              <span className="eyebrow">CONNECTED OPERATIONS</span>
              <strong>空间 · 生产 · 安防</strong>
              <p>同一对象，同一位置，同一业务上下文。</p>
            </div>
            <button onClick={() => showAlarm("AL-001")}>
              <span className="shortcut-icon orange">
                <AlertTriangle size={19} />
              </span>
              <span>
                <strong>异常现场核查</strong>
                <small>定位 → 参数 → 视频 → 人员</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
            <button
              onClick={() => {
                setTraceId(batches[0].id);
                s.locate("XL1-R377", "trace");
                s.set({ history: true, playing: false, minute: 42 });
              }}
            >
              <span className="shortcut-icon">
                <Package size={19} />
              </span>
              <span>
                <strong>成品业务追溯</strong>
                <small>成品包 → 桶次 → 设备 → 时段</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        )}
        <div className={`timeline ${s.history ? "historical" : ""}`}>
          <button
            className={s.history ? "" : "active"}
            onClick={() => s.set({ history: false, playing: false })}
          >
            <i />
            演示实时
          </button>
          <button
            className={s.history ? "active" : ""}
            onClick={() => s.set({ history: true, playing: false })}
          >
            <Clock size={13} />
            历史
          </button>
          {s.history && (
            <>
              <button
                title={s.playing ? "暂停回放" : "播放回放"}
                onClick={() => s.set({ playing: !s.playing })}
              >
                {s.playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <span>
                2026-10-25 14:{String(s.minute % 60).padStart(2, "0")}
              </span>
              <input
                aria-label="历史时间"
                type="range"
                min="0"
                max="59"
                value={s.minute}
                onChange={(e) =>
                  s.set({ minute: +e.target.value, playing: false })
                }
              />
            </>
          )}
          <small>
            {s.history
              ? "正在查看历史演示时段"
              : "运行数据、视频和人员均为演示；真实接口尚未接入"}
          </small>
        </div>
      </section>
      <footer>
        <span>
          <i />
          场景已连接 · GLB 本地模型
        </span>
        <span>鼠标左键旋转 · 右键平移 · 滚轮缩放 · 点击设备查看详情</span>
        <span>FUWEIER DIGITAL TWIN / 2026</span>
      </footer>
      {notice && (
        <div className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      {inspectedEquipment && <EquipmentDetails item={inspectedEquipment}/>}
      {wall && (
        <div className="modal-backdrop">
          <div className="modal video-wall">
            <div className="modal-title">
              <div>
                <span className="eyebrow">SECURITY / MULTI-VIEW</span>
                <h2>现场多画面监控</h2>
              </div>
              <button
                className="icon-button"
                title="关闭多画面"
                onClick={() => setWall(false)}
              >
                <X />
              </button>
            </div>
            {s.role === "manager" ? (
              <Empty>当前角色无视频查看权限</Empty>
            ) : (
              <div className="video-grid">
                {cameras.slice(0, 4).map((c) => (
                  <div key={c.id}>
                    <h4>
                      {c.name}
                      <span>{c.id}</span>
                    </h4>
                    <CameraFeed id={c.id} />
                  </div>
                ))}
              </div>
            )}
            <p className="muted small">
              模拟动态画面，未连接现场监控；录像服务未接入。
            </p>
          </div>
        </div>
      )}
      {help && (
        <div className="modal-backdrop">
          <div className="modal help-modal">
            <div className="modal-title">
              <h2>使用说明与演示范围</h2>
              <button
                className="icon-button"
                title="关闭说明"
                onClick={() => setHelp(false)}
              >
                <X />
              </button>
            </div>
            <p>
              从左侧选择建筑，或使用搜索直接定位设备、摄像头和人员。前纺结构塔楼支持单层、展开、结构显隐与水平剖切。
            </p>
            <p>
              点击顶部专题，保留当前空间对象；从异常、工艺或业务记录也可以反向定位场景。
            </p>
            <p>
              厂区模型为 CAD
              草稿。设备、测点和工艺参数依据 v1.5 明细表；设备位置、生产记录、摄像头覆盖和人员为演示数据，测点尚未接入采集值。角色切换仅展示权限交互，不构成服务端鉴权。
            </p>
            <p>
              处置记录保存在当前浏览器。点位配置可导出
              JSON。真实视频、人员定位、业务底座接口与现场核验尚未接入。
            </p>
            <button
              className="wide-button accent"
              onClick={() => {
                setHelp(false);
                walkthrough(0);
              }}
            >
              开始五步导览
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
      {config && (
        <ConfigModal
          onClose={() => setConfig(false)}
          onSaved={() => {
            setNotice("点位配置已保存；正在重新加载场景");
            setTimeout(() => location.reload(), 700);
          }}
        />
      )}
    </div>
  );
}

function ConfigModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [id, setId] = useState(equipment[0].id);
  const item = equipment.find((e) => e.id === id)!;
  const [position, setPosition] = useState([...item.position]);
  const [floor, setFloor] = useState(item.floor || "");
  const s = useTwin();
  const updateId = (id: string) => {
    const e = equipment.find((e) => e.id === id)!;
    setId(id);
    setPosition([...e.position]);
    setFloor(e.floor || "");
  };
  const save = () => {
    if (position.some((v) => !Number.isFinite(v))) return;
    let existing: Record<string, unknown> = {};
    try {
      existing = JSON.parse(localStorage.getItem("fuweier-points-v2") || "{}");
    } catch {}
    const value = { ...existing, [id]: { position, floor, site: item.site } };
    localStorage.setItem("fuweier-points-v2", JSON.stringify(value));
    onSaved();
  };
  return (
    <div className="modal-backdrop">
      <div className="modal config-modal">
        <div className="modal-title">
          <div>
            <span className="eyebrow">SPATIAL CONFIGURATION</span>
            <h2>设备点位配置</h2>
          </div>
          <button className="icon-button" title="关闭配置" onClick={onClose}>
            <X />
          </button>
        </div>
        <p className="muted">
          维护模型坐标（米），修改保存在当前浏览器，可导出后交给正式数据服务。
        </p>
        <label>
          设备
          <select value={id} onChange={(e) => updateId(e.target.value)}>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} · {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          楼层
          <select value={floor} onChange={(e) => setFloor(e.target.value)}>
            <option value="">地面层 / 无楼层编号</option>
            {item.site === "P1_TOWER" &&
              floors.map((f) => (
                <option value={f.id} key={f.id}>
                  {f.label}
                </option>
              ))}
          </select>
        </label>
        <div className="coordinate-inputs">
          {["X", "Y", "Z"].map((label, i) => (
            <label key={label}>
              {label}
              <input
                type="number"
                step=".1"
                value={position[i]}
                onChange={(e) =>
                  setPosition(
                    position.map((v, j) => (j === i ? +e.target.value : v)),
                  )
                }
              />
            </label>
          ))}
        </div>
        <div className="notice-card">
          <p>
            建筑：{siteNames[item.site]}
            。坐标为模型空间坐标，楼层展开偏移不写入点位。
          </p>
        </div>
        <div className="modal-actions">
          <button
            className="wide-button"
            onClick={() => {
              s.locate(id);
              onClose();
            }}
          >
            <Focus size={14} />
            定位设备
          </button>
          <button className="wide-button accent" onClick={save}>
            保存点位
          </button>
        </div>
        <button
          className="wide-button"
          onClick={() =>
            saveFile("fuweier-spatial-bindings.json", {
              version: 1,
              source: "demo",
              equipment,
              cameras,
              people,
              model: modelIndex,
              view: { site: s.site, floor: s.floor, mode: s.mode },
            })
          }
        >
          <Download size={15} />
          导出空间与业务绑定配置
        </button>
      </div>
    </div>
  );
}
