import { create } from "zustand";
import {
  equipment,
  cameras,
  people,
  type ModuleId,
  type ViewMode,
} from "./data.ts";
import { inspectionContext } from './domain.mjs';
type State = {
  module: ModuleId;
  site: string;
  floor: string;
  mode: ViewMode;
  selected: string | null;
  inspection: string | null;
  inspect: (id: string) => void;
  line: string;
  query: string;
  focus: number;
  history: boolean;
  minute: number;
  playing: boolean;
  role: "operator" | "security" | "manager";
  layers: {
    equipment: boolean;
    cameras: boolean;
    people: boolean;
    labels: boolean;
  };
  structure: Record<string, boolean>;
  clip: number;
  set: (state: Partial<State>) => void;
  locate: (id: string, module?: ModuleId) => void;
  goSite: (site: string) => void;
  home: () => void;
};
export const useTwin = create<State>((set, get) => ({
  module: "overview",
  site: "all",
  floor: "all",
  mode: "complete",
  selected: null,
  inspection: null,
  inspect: (id) => {
    if (equipment.some(e => e.id === id)) set(inspectionContext(id));
  },
  line: "all",
  query: "",
  focus: 0,
  history: false,
  minute: 45,
  playing: true,
  role: "security",
  layers: { equipment: true, cameras: false, people: false, labels: true },
  structure: { beam: true, column: true, slab: true, wall: false, stair: true },
  clip: 18,
  set,
  locate: (id, module) => {
    const e =
      equipment.find((x) => x.id === id) ||
      cameras.find((x) => x.id === id) ||
      people.find((x) => x.id === id);
    if (!e) return;
    set({
      site: e.site,
      floor: e.floor || "all",
      mode: e.floor ? "single" : "interior",
      selected: id,
      inspection: null,
      focus: get().focus + 1,
      ...("line" in e && e.line !== "shared" ? { line: e.line } : {}),
      ...("line" in e ? { layers: { ...get().layers, equipment: true } } : {}),
      ...(module ? { module } : {}),
      ...(id.startsWith("CAM")
        ? { layers: { ...get().layers, cameras: true } }
        : {}),
      ...(id.startsWith("P-")
        ? { layers: { ...get().layers, people: true } }
        : {}),
    });
  },
  goSite: (site) =>
    set({
      site,
      floor: "all",
      selected: null,
      inspection: null,
      mode: site === "P1_TOWER" ? "structure" : "complete",
      focus: get().focus + 1,
    }),
  home: () =>
    set({
      site: "all",
      floor: "all",
      mode: "complete",
      selected: null,
      inspection: null,
      focus: get().focus + 1,
    }),
}));
