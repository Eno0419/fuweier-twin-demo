import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  equipment,
  cameras,
  people,
  alarms,
  batches,
  floors,
} from "../src/data.ts";
import {
  displayPosition,
  transitionAlarm,
  validPeople,
  locateContext,
} from "../src/domain.mjs";
const model = JSON.parse(
  fs.readFileSync(new URL("../src/model-index.json", import.meta.url), "utf8"),
);
test("GLB preserves 848 unique detailed structural IDs across seven floor elevations", () => {
  const bytes = fs.readFileSync(
    new URL("../public/fuweier-factory-site.glb", import.meta.url),
  );
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const gltf = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  const nodes = gltf.nodes.filter((n) => n.extras?.site_id === "P1_TOWER");
  assert.equal(nodes.length, 848);
  assert.equal(new Set(nodes.map((n) => n.extras.object_id)).size, 848);
  assert.deepEqual(
    [...new Set(nodes.map((n) => n.extras.floor_id))].sort(),
    floors.map((f) => f.id).sort(),
  );
});
test("every business anchor is inside its registered building and has a valid floor", () => {
  for (const entity of [...equipment, ...cameras, ...people]) {
    const b = model.sites[entity.site];
    assert.ok(b, entity.id);
    assert.ok(
      entity.position[0] >= b.min[0] - 1 && entity.position[0] <= b.max[0] + 1,
      `${entity.id} x outside building`,
    );
    assert.ok(
      entity.position[2] >= b.min[2] - 1 && entity.position[2] <= b.max[2] + 1,
      `${entity.id} z outside building`,
    );
    if (entity.floor) assert.ok(model.floors[entity.floor], entity.id);
  }
});
test("equipment, cameras and people on L3 receive the same display offset without mutating coordinates", () => {
  const group = [
    equipment.find((e) => e.id === "XL1-R130"),
    cameras[0],
    people[0],
  ];
  for (const entity of group) {
    const original = [...entity.position];
    const result = displayPosition(entity.position, entity.floor, "explode");
    assert.equal(result[1] - entity.position[1], 33);
    assert.deepEqual(entity.position, original);
    assert.deepEqual(
      displayPosition(entity.position, entity.floor, "single"),
      original,
    );
  }
});
test("all incident, camera-coverage and trace links resolve to a unique equipment identity", () => {
  const ids = new Set(equipment.map((e) => e.id));
  assert.equal(ids.size, equipment.length);
  for (const a of alarms) assert.ok(ids.has(a.equipmentId));
  for (const c of cameras) for (const id of c.covers) assert.ok(ids.has(id));
  for (const b of batches)
    for (const id of b.equipmentIds) assert.ok(ids.has(id));
  assert.equal(equipment.filter((e) => e.site !== 'P1_TOWER').length, 0);
});
test("event workflow cannot skip confirmation or recovery", () => {
  assert.equal(transitionAlarm("pending", "close"), "pending");
  assert.equal(transitionAlarm("pending", "recover"), "pending");
  assert.equal(transitionAlarm("pending", "confirm"), "confirmed");
  assert.equal(transitionAlarm("confirmed", "recover"), "recovered");
  assert.equal(transitionAlarm("recovered", "close"), "closed");
  assert.equal(transitionAlarm("closed", "confirm"), "closed");
});
test("counts exclude expired positions and offline personnel", () => {
  const now = 100000;
  assert.equal(
    validPeople(
      [
        { state: "valid", updatedAt: now - 1000 },
        { state: "valid", updatedAt: now - 70000 },
        { state: "offline", updatedAt: now },
        { state: "stale", updatedAt: now },
      ],
      now,
    ).length,
    1,
  );
});
test("navigation retains object identity and selects the actual containing floor", () => {
  const e = equipment.find((e) => e.id === "XL1-R130");
  assert.deepEqual(locateContext(e, "alarms"), {
    site: "P1_TOWER",
    floor: "L03_EL+13.000",
    selected: "XL1-R130",
    mode: "single",
    module: "alarms",
  });
});
