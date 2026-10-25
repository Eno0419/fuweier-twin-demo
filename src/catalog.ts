import source from './equipment-source.json' with { type: 'json' };
import { FLOOR_IDS, ELEVATIONS } from './domain.mjs';
export const catalogSource = source;
export type Measurement = (typeof source.records)[number]['points'][number];
export type CatalogRecord = (typeof source.records)[number];

// CAD floor titles and equipment annotations guide these approximate zones.
// The spreadsheet owns identities and point associations, not these demo coordinates.
const floorByProcess: Record<string, number> = {
  '风送': 6, '转鼓': 4, '熔融挤出': 5, '熔体过滤器': 5,
  '计量': 3, '纺丝箱体': 3, '组件': 3, '环吹': 2,
  '上油、集束': 1, '牵引机': 1, '喂入': 1, '往复机': 0,
  '集束架': 0, '导丝机': 0, '浸油槽': 0, '第一牵伸机': 0,
  '水浴槽': 0, '第二牵伸机': 0, '蒸汽箱': 0, '第三牵伸机': 0,
  '叠丝机': 0, '三辊牵引机': 0, '张力辊': 0, '卷曲预热箱': 0,
  '卷曲机': 0, '喷油器': 0, '夹丝皮带': 0, '烘箱': 0,
  '污染检测': 0, '金属检测': 0, '切断机': 0, '打包机': 0,
};
export const catalogEquipment = source.records.map((record) => {
  const floorIndex = floorByProcess[record.process] ?? 0;
  const sameFloor = source.records.filter(r => r.line === record.line && (floorByProcess[r.process] ?? 0) === floorIndex);
  const slot = sameFloor.findIndex(r => r.id === record.id);
  const columns = floorIndex === 0 ? 4 : 2;
  const rows = Math.ceil(sameFloor.length / columns);
  const position: [number,number,number] = [
    (record.line === '1' ? 229 : 245) + (slot % columns) * (columns === 4 ? 3.2 : 7),
    ELEVATIONS[floorIndex] + 0.22,
    -338 + Math.floor(slot / columns) * (rows > 1 ? 42 / (rows - 1) : 0),
  ];
  const kind: 'tank'|'dryer'|'roller'|'packer' = /泵|鼓|槽|仓/.test(record.name) ? 'tank' : /风|干燥|烘/.test(record.name) ? 'dryer' : /打包|检测/.test(record.name) ? 'packer' : 'roller';
  return { ...record, site: 'P1_TOWER', floor: FLOOR_IDS[floorIndex], position, kind,
    state: (record.id === 'XL1-R130' ? 'alarm' : record.id === 'XL2-R134' ? 'stale' : record.id === 'XL2-R220' ? 'stopped' : 'running') as 'alarm'|'stale'|'stopped'|'running',
    unit: '', shared: false,
    placementNote: floorIndex === 0 ? '按要求统一放入塔楼地面层，后纺及配套设备为 DEMO 布置。' : '参考 CAD 七个标高及干燥、螺杆、纺丝相关注记分区；坐标和具体楼层为 DEMO 示意，未逐台配准。',
  };
});
