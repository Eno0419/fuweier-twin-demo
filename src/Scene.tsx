import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  CameraControls,
  Html,
  Line,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "./store";
import {
  equipment,
  cameras,
  people,
  siteNames,
  floors,
  type Equipment,
  type Vec3,
} from "./data";
import { displayPosition, floorOffset } from "./domain.mjs";
import index from "./model-index.json";
const sites = index.sites as Record<
  string,
  { center: number[]; min: number[]; max: number[]; size: number[] }
>;
const floorIndex = index.floors as Record<
  string,
  { min: number[]; max: number[] }
>;
const colors = {
  running: "#77cbb8",
  alarm: "#ffad61",
  stopped: "#81909b",
  stale: "#b4a2e0",
};
const structuralColors: Record<string, string> = {
  slab: "#b2c0d0", beam: "#a1b2c4", column: "#8399b0",
  stair: "#8fa7bf", wall: "#ced7e1",
};

function Campus() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}fuweier-factory-site.glb`);
  const { site, floor, mode, structure, clip, goSite } = useTwin();
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = (o.material as THREE.MeshStandardMaterial).clone();
        o.userData.baseY = o.position.y;
      }
    });
    return copy;
  }, [scene]);
  useEffect(() => {
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const u = o.userData;
      const m = o.material as THREE.MeshStandardMaterial;
      const own = u.site_id === site;
      const landscape = !u.site_id || u.site_id === "ROADS";
      o.visible =
        site === "all" ||
        own ||
        (landscape && o.name.toLowerCase().includes("ground"));
      o.position.y = u.baseY + floorOffset(u.floor_id, mode);
      if (own) {
        if (mode === "interior" && !u.floor_id) o.visible = false;
        if (mode === "single" && floor !== "all" && u.floor_id !== floor)
          o.visible = false;
        if (mode === "interior" && u.entity_type === "wall") o.visible = false;
        if (
          mode !== "complete" &&
          (u.site_role === "illustrative_roof" ||
            o.name.includes("roof") ||
            u.site_role === "cad_envelope" ||
            o.name.includes("facade") ||
            o.name.includes("windows") ||
            o.name.includes("doors"))
        )
          o.visible = false;
        if (
          ["single", "explode", "structure"].includes(mode) &&
          u.entity_type &&
          structure[u.entity_type] === false
        )
          o.visible = false;
      }
      m.roughness = 0.85;
      m.metalness = 0.08;
      // Cool structural tones keep floor edges legible on the light workbench.
      if (structuralColors[u.entity_type]) m.color.set(structuralColors[u.entity_type]);
      m.emissive.set(own ? "#173453" : "#000000");
      m.emissiveIntensity = own ? 0.25 : 0;
      m.clippingPlanes =
        mode === "clip" && own
          ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), clip)]
          : [];
      m.needsUpdate = true;
    });
  }, [model, site, floor, mode, structure, clip]);
  return (
    <primitive
      object={model}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const id = e.object.userData.site_id;
        if (id && sites[id] && id !== "ROADS" && site !== id) goSite(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (e.object.userData.site_id) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    />
  );
}
function Machine({ item }: { item: Equipment }) {
  const { selected, mode, inspect, layers } = useTwin();
  const position = displayPosition(item.position, item.floor, mode) as Vec3;
  const c = colors[item.state];
  const selectedNow = selected === item.id;
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.07;
      ring.current.scale.set(s, s, s);
    }
  });
  return (
    <group
      position={position}
      scale={item.isMain ? 0.36 : 0.19}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta < 4) inspect(item.id);
      }}
    >
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[7, 0.35, 5]} />
        <meshStandardMaterial color="#34484d" />
      </mesh>
      {item.kind === "tank" ? (
        <>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[1.7, 1.7, 3.6, 20]} />
            <meshStandardMaterial
              color="#bbc8c9"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0, 3.9, 0]}>
            <coneGeometry args={[1.7, 1, 20]} />
            <meshStandardMaterial color="#87a6a7" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[5, 2.8, 3.4]} />
            <meshStandardMaterial
              color={selectedNow ? "#b1d6c9" : "#9aaeb3"}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
          {[-1.5, 0, 1.5].map((x) => (
            <mesh
              key={x}
              position={[x, 2.1, 1.8]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
              <meshStandardMaterial color="#334a52" />
            </mesh>
          ))}
          <mesh position={[1.9, 2.4, -1.8]}>
            <boxGeometry args={[0.8, 0.8, 0.2]} />
            <meshBasicMaterial color={c} />
          </mesh>
        </>
      )}
      <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={ring}>
        <ringGeometry args={[4.4, selectedNow ? 4.8 : 4.55, 48]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={selectedNow ? 0.9 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {(layers.labels && (item.isMain || selectedNow)) && <Html wrapperClass="device-label" position={[0, 5, 0]} center zIndexRange={[10, 0]}>
        <button
          className={`device-pin ${item.state} ${selectedNow ? "selected" : ""}`}
          data-label-priority={selectedNow ? 100 : item.state === 'alarm' ? 90 : item.points.length > 0 ? 50 : 10}
          aria-label={`查看设备详情：${item.name} ${item.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); inspect(item.id); }}
        >
          <i />
          {item.name}
          <small>{item.sourceSheet} · {item.tag || '位号未填写'}</small>
        </button>
      </Html>}
    </group>
  );
}
function World() {
  const controls = useRef<CameraControls>(null);
  const lastFocus = useRef(0);
  const { size, camera } = useThree();
  const state = useTwin();
  const { site, floor, mode, selected, focus, layers, line, module } = state;
  useEffect(() => {
    if (!controls.current) return;
    let min: Vec3 = [-30, -1, -430],
      max: Vec3 = [350, 35, 10];
    const target = useTwin.getState().selected;
    const entity = focus !== lastFocus.current ? (
      equipment.find((e) => e.id === target) ||
      cameras.find((e) => e.id === target) ||
      people.find((e) => e.id === target)) : undefined;
    lastFocus.current = focus;
    if (entity) {
      const p = displayPosition(entity.position, entity.floor, mode);
      min = [p[0] - 16, p[1] - 2, p[2] - 15];
      max = [p[0] + 16, p[1] + 12, p[2] + 15];
    } else if (site !== "all" && sites[site]) {
      const b =
        mode === "single" && floorIndex[floor]
          ? floorIndex[floor]
          : sites[site];
      min = [...b.min] as Vec3;
      max = [...b.max] as Vec3;
      if (mode === "explode") max[1] += 66;
    }
    const box = new THREE.Box3(
      new THREE.Vector3(...min),
      new THREE.Vector3(...max),
    );
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    const vFov =
      THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov) / 2;
    const hFov = Math.atan((Math.tan(vFov) * size.width) / size.height);
    const distance = (radius / Math.sin(Math.min(vFov, hFov))) * 1.05;
    const direction = new THREE.Vector3(0.85, 1.1, 1.05).normalize();
    const eye = center.clone().addScaledVector(direction, distance);
    controls.current.setLookAt(
      eye.x,
      eye.y,
      eye.z,
      center.x,
      center.y,
      center.z,
      true,
    );
  }, [site, floor, mode, focus, size.width, size.height, camera]);
  const visible = (e: { site: string; floor?: string }) =>
    (site === "all" || e.site === site) &&
    (mode !== "single" || floor === "all" || e.floor === floor);
  const showEquipment =
    layers.equipment && (site !== "all" || module !== "overview");
  const keySites = [
    "P1_HALL",
    "P1_TOWER",
    "P2_HALL",
    "WAREHOUSE",
    "POLYMER_MAIN",
    "OFFICE",
    "POWER",
  ];
  return (
    <>
      <color attach="background" args={["#e9eef2"]} />
      <fog attach="fog" args={["#e9eef2", 950, 2100]} />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#dceef1", "#54756a", 0.8]} />
      <directionalLight position={[250, 500, 100]} intensity={1.7} />
      <Campus />
      <LabelLayout />
      {site !== "all" &&
        site !== "P1_TOWER" &&
        mode === "interior" &&
        sites[site] && (
          <group>
            <mesh
              position={[sites[site].center[0], 0.02, sites[site].center[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[sites[site].size[0], sites[site].size[2]]}
              />
              <meshStandardMaterial color="#4b625e" roughness={1} />
            </mesh>
            <Line
              points={[
                [sites[site].min[0] + 3, 0.05, sites[site].center[2] + 8],
                [sites[site].max[0] - 3, 0.05, sites[site].center[2] + 8],
              ]}
              color="#b6c58a"
              lineWidth={1}
              dashed
              dashSize={2}
              gapSize={2}
            />
          </group>
        )}
      <mesh position={[170, -1.5, -210]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color="#e3e9ee" roughness={1} />
      </mesh>
      {site !== "all" &&
        sites[site] &&
        (() => {
          const b = sites[site],
            y = 0.25;
          return (
            <Line
              points={[
                [b.min[0] - 2, y, b.min[2] - 2],
                [b.max[0] + 2, y, b.min[2] - 2],
                [b.max[0] + 2, y, b.max[2] + 2],
                [b.min[0] - 2, y, b.max[2] + 2],
                [b.min[0] - 2, y, b.min[2] - 2],
              ]}
              color="#2668dd"
              lineWidth={1.5}
            />
          );
        })()}
      {layers.labels &&
        site === "all" &&
        keySites.map((id) => {
          const s = sites[id];
          return (
            <Html
              key={id}
              position={[s.center[0], s.max[1] + 8, s.center[2]]}
              center
              zIndexRange={[8, 0]}
            >
              <button
                className={`building-pin ${id === "P1_TOWER" ? "featured" : ""}`}
                onClick={() => state.goSite(id)}
              >
                {id === "P1_TOWER" && <span className="pulse-dot" />}
                {siteNames[id]}
                <small>
                  {id === "P1_TOWER" ? "7 个标高 · 可分层" : "点击进入"}
                </small>
              </button>
            </Html>
          );
        })}
      {showEquipment &&
        equipment
          .filter(
            (e) =>
              visible(e) && (line === "all" || e.line === line || e.shared),
          )
          .map((e) => <Machine key={e.id} item={e} />)}
      {layers.cameras &&
        cameras.filter(visible).map((c) => (
          <group
            key={c.id}
            position={displayPosition(c.position, c.floor, mode) as Vec3}
          >
            <mesh>
              <boxGeometry args={[1.2, 0.8, 2]} />
              <meshStandardMaterial color={c.online ? "#97bfde" : "#687482"} />
            </mesh>
            <Html position={[0, 2, 0]} center zIndexRange={[12, 0]}>
              <button
                className="map-marker camera"
                onClick={() => state.locate(c.id, "security")}
              >
                ◉ {c.name}
              </button>
            </Html>
          </group>
        ))}
      {layers.people &&
        !state.history &&
        state.role !== "manager" &&
        people.filter(visible).map((p) => (
          <group
            key={p.id}
            position={displayPosition(p.position, p.floor, mode) as Vec3}
          >
            <mesh position={[0, 1, 0]}>
              <capsuleGeometry args={[0.38, 1, 4, 8]} />
              <meshStandardMaterial
                color={p.state === "valid" ? "#b9de8b" : "#7b8590"}
              />
            </mesh>
            <Html position={[0, 3, 0]} center zIndexRange={[12, 0]}>
              <button
                className="map-marker"
                onClick={() => state.locate(p.id, "security")}
              >
                {p.name}
                {p.state !== "valid" ? " · 失效" : ""}
              </button>
            </Html>
          </group>
        ))}
      {site === "P1_TOWER" &&
        mode === "explode" &&
        floors.map((f) => (
          <Html
            key={f.id}
            position={[263, f.elevation + floorOffset(f.id, mode), -318]}
            zIndexRange={[9, 0]}
          >
            <button
              className="floor-pin"
              onClick={() =>
                state.set({ floor: f.id, mode: "single", selected: null })
              }
            >
              {f.label}
            </button>
          </Html>
        ))}
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={12}
        maxDistance={1500}
        maxPolarAngle={Math.PI / 2 - 0.04}
        smoothTime={0.7}
      />
    </>
  );
}
// Screen-space decluttering keeps dense source catalogs usable without hiding equipment meshes.
function LabelLayout() {
  const { gl } = useThree();
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    elapsed.current += dt;
    if (elapsed.current < 0.16) return;
    elapsed.current = 0;
    const buttons = [...(gl.domElement.parentElement?.parentElement?.querySelectorAll<HTMLButtonElement>('.device-pin') || [])];
    const occupied: DOMRect[] = [];
    buttons.sort((a,b)=>Number(b.dataset.labelPriority)-Number(a.dataset.labelPriority));
    for(const button of buttons) {
      const rect=button.getBoundingClientRect();
      const collision=occupied.some(r=>rect.left<r.right+5 && rect.right>r.left-5 && rect.top<r.bottom+5 && rect.bottom>r.top-5);
      button.style.visibility=collision?'hidden':'visible';
      if(!collision) occupied.push(rect);
    }
  });
  return null;
}
export default function Scene() {
  return (
    <>
      <Canvas
        camera={{ position: [650, 480, 260], fov: 40, near: 0.1, far: 3500 }}
        dpr={[1, 1.5]}
        // Preserve centimetre-scale roof/facade separation at campus viewing distances.
        gl={{ antialias: true, localClippingEnabled: true, logarithmicDepthBuffer: true }}
        onPointerMissed={() => useTwin.getState().set({ selected: null })}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
      <LoadStatus />
    </>
  );
}
function LoadStatus() {
  const { active, progress } = useProgress();
  return active ? (
    <div className="scene-loading loading">
      正在加载厂区模型… {Math.round(progress)}%
    </div>
  ) : null;
}
