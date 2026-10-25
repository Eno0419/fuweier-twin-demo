import { catalogEquipment, type CatalogRecord } from "./catalog.ts";
import { FLOOR_IDS, ELEVATIONS } from "./domain.mjs";
export type Vec3 = [number, number, number];
export type ModuleId =
  | "overview"
  | "production"
  | "process"
  | "monitor"
  | "alarms"
  | "trace"
  | "security";
export type ViewMode =
  "complete" | "interior" | "single" | "explode" | "structure" | "clip";
export type Equipment = CatalogRecord & {
  placementNote: string;
  id: string;
  name: string;
  site: string;
  floor?: string;
  line: string;
  process: string;
  position: Vec3;
  state: "running" | "alarm" | "stopped" | "stale";
  kind: "tank" | "dryer" | "roller" | "packer";
  unit: string;
  shared?: boolean;
};
export const modules: { id: ModuleId; name: string; en: string }[] = [
  { id: "overview", name: "厂区总览", en: "CAMPUS" },
  { id: "production", name: "重点产线", en: "PRODUCTION" },
  { id: "process", name: "工艺可视化", en: "PROCESS" },
  { id: "monitor", name: "运行监测", en: "MONITOR" },
  { id: "alarms", name: "异常工作台", en: "INCIDENTS" },
  { id: "trace", name: "业务追溯", en: "TRACEABILITY" },
  { id: "security", name: "安防监控", en: "SECURITY" },
];
export const siteNames: Record<string, string> = {
  P1_TOWER: "前纺结构塔楼",
  P1_HALL: "卫材一线车间",
  P1_ANNEX: "一线附属区",
  P2_HALL: "卫材二线车间",
  P2_FRONT: "二线前纺区",
  P2_LOW: "二线配套区",
  P2_EXT: "二线扩建区",
  WAREHOUSE: "综合仓库",
  WAREHOUSE_DOCK: "仓库装卸区",
  POWER: "配电站",
  PUMP: "水泵房",
  EG_PUMP: "乙二醇泵房",
  OFFICE: "综合办公楼",
  CONTROL: "控制中心",
  RESEARCH: "研发楼",
  POLYMER_MAIN: "聚合主厂房",
  POLYMER_HIGH: "聚合高层区",
  POLYMER_LOW: "聚合低层区",
  THERMAL1: "热媒站一期",
  THERMAL2: "热媒站二期",
  AUX: "公辅预留区",
  HALL3: "三期厂房",
  HARDWARE: "五金仓库",
  SOLID_WASTE: "固废区",
  FIRE_POOL: "消防水池",
  MAIN_GATE: "厂区主入口",
  GATE2: "厂区次入口",
  UG_FIRE: "地下消防设施",
  WW_FOUNDATION: "污水处理预留区",
};
export const floors = FLOOR_IDS.map((id: string, i: number) => ({
  id,
  label: `L${i} · ${ELEVATIONS[i].toFixed(1)}m`,
  short: `L${i}`,
  elevation: ELEVATIONS[i],
}));
export const equipment: Equipment[] = catalogEquipment;
export const cameras = [
  {
    id: "CAM-01",
    name: "前纺 L3 作业面",
    site: "P1_TOWER",
    floor: FLOOR_IDS[3],
    position: [256, 17, -279] as Vec3,
    online: true,
    covers: ["XL1-R130"],
    angle: 220,
  },
  {
    id: "CAM-02",
    name: "丝桶交接区",
    site: "P1_TOWER",
    floor: FLOOR_IDS[0],
    position: [257, 4, -290] as Vec3,
    online: true,
    covers: ["XL1-R230"],
    angle: 230,
  },
  {
    id: "CAM-03",
    name: "一线后纺通道",
    site: "P1_HALL",
    position: [145, 6, -278] as Vec3,
    online: true,
    covers: ["XL1-R287"],
    angle: 180,
  },
  {
    id: "CAM-04",
    name: "二线生产区",
    site: "P2_HALL",
    position: [120, 6, -168] as Vec3,
    online: true,
    covers: ["XL2-R134", "XL2-R183"],
    angle: 180,
  },
  {
    id: "CAM-05",
    name: "成品入库口",
    site: "WAREHOUSE",
    position: [180, 6, -100] as Vec3,
    online: false,
    covers: [],
    angle: 120,
  },
  {
    id: "CAM-06",
    name: "一线打包工位",
    site: "P1_HALL",
    position: [87, 6, -278] as Vec3,
    online: true,
    covers: ["XL1-R377"],
    angle: 180,
  },
];
export const people = [
  {
    id: "P-01",
    name: "维修员 01",
    role: "设备维修",
    team: "维修班",
    site: "P1_TOWER",
    floor: FLOOR_IDS[3],
    position: [250, 13.5, -280] as Vec3,
    state: "valid",
  },
  {
    id: "P-02",
    name: "操作员 02",
    role: "前纺操作",
    team: "生产 A 班",
    site: "P1_TOWER",
    floor: FLOOR_IDS[3],
    position: [246, 13.5, -290] as Vec3,
    state: "valid",
  },
  {
    id: "P-03",
    name: "巡检员 03",
    role: "巡检",
    team: "维修班",
    site: "P1_TOWER",
    floor: FLOOR_IDS[1],
    position: [250, 5, -290] as Vec3,
    state: "stale",
  },
  {
    id: "P-04",
    name: "操作员 04",
    role: "后纺操作",
    team: "生产 A 班",
    site: "P1_HALL",
    position: [125, 0.6, -280] as Vec3,
    state: "valid",
  },
  {
    id: "P-05",
    name: "操作员 05",
    role: "二线操作",
    team: "生产 B 班",
    site: "P2_HALL",
    position: [110, 0.6, -170] as Vec3,
    state: "valid",
  },
  {
    id: "P-06",
    name: "仓管员 06",
    role: "仓储",
    team: "物流班",
    site: "WAREHOUSE",
    position: [150, 0.6, -85] as Vec3,
    state: "offline",
  },
];
export const alarms = [
  {
    id: "AL-001",
    equipmentId: "XL1-R130",
    title: "纺丝箱体温度高限",
    severity: "high",
    time: "14:42:18",
    source: "演示阈值规则",
    description: "演示异常事件：请核对原表纺丝箱体测点和运行标准。当前未接入采集值，不能据此判定现场超限。",
    status: "pending",
  },
  {
    id: "AL-002",
    equipmentId: "XL2-R134",
    title: "运行数据更新中断",
    severity: "medium",
    time: "14:38:06",
    source: "演示数据质量规则",
    description: "超过 60 秒未收到数据；设备实际运行状态未知。",
    status: "pending",
  },
  {
    id: "AL-003",
    equipmentId: "XL2-R220",
    title: "牵伸机计划停机核查",
    severity: "low",
    time: "14:20:30",
    source: "人工演示报障",
    description: "设备处于停机状态，需核对计划与交接记录。",
    status: "confirmed",
  },
];
export const batches = [
  {
    id: "PK-20261025-0086",
    batch: "B-20261025-A",
    bucket: "T-024 / 装载 006",
    task: "MO-20261025-01",
    line: "1",
    quality: "合格",
    time: "14:00–15:00",
    equipmentIds: ["XL1-R006", "XL1-R130", "XL1-R230", "XL1-R287", "XL1-R377"],
    gap: false,
  },
  {
    id: "PK-20261025-0087",
    batch: "B-20261025-B",
    bucket: "T-031 / 装载 002",
    task: "MO-20261025-02",
    line: "2",
    quality: "待复检",
    time: "14:00–15:00",
    equipmentIds: ["XL2-R006", "XL2-R134", "XL2-R183", "XL2-R220", "XL2-R309"],
    gap: true,
  },
];
export const stateLabel = {
  running: "运行",
  alarm: "异常",
  stopped: "停机",
  stale: "数据过期",
};
export const statusLabel: Record<string, string> = {
  pending: "待确认",
  confirmed: "处理中",
  recovered: "已恢复",
  closed: "已关闭",
};
export const processes = [...new Set(equipment.map(e => e.process))];

// DEMO anchors are placed inside the audited building bounds; positions are illustrative.
for (const e of [...cameras, ...people]) {
  if (e.site === "P1_TOWER") e.position[2] -= 30;

}

// Demo camera coverage follows the updated equipment locations; no inferred physical coverage.
for (const c of cameras) {
  const e = equipment.find(e => c.covers.includes(e.id));
  if (e) { c.site = e.site; c.floor = e.floor; c.position = [e.position[0], e.position[1] + 2, e.position[2] + 1]; c.name = e.process + '作业区（模拟）'; }
}
try {
  const overrides = JSON.parse(
    localStorage.getItem("fuweier-points-v2") || "{}",
  );
  for (const e of equipment) {
    const v = overrides[e.id];
    if (
      v &&
      Array.isArray(v.position) &&
      v.position.length === 3 &&
      v.position.every(Number.isFinite) &&
      v.site === e.site
    ) {
      e.position = v.position;
      e.floor = v.floor || undefined;
    }
  }
} catch {
  /* Missing or invalid local overrides use the demo configuration. */
}
