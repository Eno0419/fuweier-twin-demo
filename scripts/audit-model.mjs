import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const bytes = fs.readFileSync(
  new URL("../public/fuweier-factory-site.glb", import.meta.url),
);
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
gltf.scene.updateMatrixWorld(true);
const sites = {};
const floors = {};
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const x = o.userData;
  const key = x.site_id || "LANDSCAPE";
  const box = new THREE.Box3().setFromObject(o);
  sites[key] ??= { box: new THREE.Box3(), count: 0, roles: new Set() };
  sites[key].box.union(box);
  sites[key].count++;
  sites[key].roles.add(x.site_role);
  if (x.floor_id) {
    floors[x.floor_id] ??= {
      box: new THREE.Box3(),
      count: 0,
      elevation: x.elevation_m,
    };
    floors[x.floor_id].box.union(box);
    floors[x.floor_id].count++;
  }
});
const serial = (x) => ({
  min: x.box.min.toArray(),
  max: x.box.max.toArray(),
  center: x.box.getCenter(new THREE.Vector3()).toArray(),
  size: x.box.getSize(new THREE.Vector3()).toArray(),
  count: x.count,
  ...(x.roles ? { roles: [...x.roles] } : { elevation: x.elevation }),
});
const report = {
  scene: gltf.scene.userData,
  sites: Object.fromEntries(
    Object.entries(sites).map(([k, v]) => [k, serial(v)]),
  ),
  floors: Object.fromEntries(
    Object.entries(floors).map(([k, v]) => [k, serial(v)]),
  ),
};
fs.writeFileSync(
  new URL("../src/model-index.json", import.meta.url),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({ sites: report.sites, floors: report.floors }, null, 2),
);
