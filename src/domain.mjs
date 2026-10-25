export const FLOOR_IDS = [
  "L00_EL+00.000",
  "L01_EL+04.600",
  "L02_EL+09.600",
  "L03_EL+13.000",
  "L04_EL+19.000",
  "L05_EL+24.200",
  "L06_EL+27.300",
];
export const ELEVATIONS = [0, 4.6, 9.6, 13, 19, 24.2, 27.3];
// Inspection never changes navigation, camera requests, filters or business context.
export function inspectionContext(id) {
  return { selected: id, inspection: id };
}
export function floorOffset(floor, mode) {
  return mode === "explode" ? Math.max(0, FLOOR_IDS.indexOf(floor)) * 11 : 0;
}
export function displayPosition(position, floor, mode) {
  return [position[0], position[1] + floorOffset(floor, mode), position[2]];
}
export function validPeople(people, now) {
  return people.filter(
    (p) => p.state === "valid" && now - p.updatedAt <= 60000,
  );
}
export function transitionAlarm(status, action) {
  const allowed = {
    pending: { confirm: "confirmed" },
    confirmed: { recover: "recovered" },
    recovered: { close: "closed" },
  };
  return allowed[status]?.[action] || status;
}
export function locateContext(entity, module) {
  return {
    site: entity.site,
    floor: entity.floor || "all",
    selected: entity.id,
    mode: entity.floor ? "single" : "interior",
    module,
  };
}
