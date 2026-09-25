// ─────────────────────────────────────────────────────────────────────────────
// ON-DEVICE AI, FOR THE PHONE THE LEARNER ACTUALLY HAS.
//
// The honest constraint first: a transformer does not fit on the 2016 Android
// this project is for — 1 GB of RAM, a 1.3 GHz Cortex-A53, maybe 200 MB of free
// storage and a metered connection. Any design that pretends otherwise produces
// an app that is unusable on exactly the devices it exists to serve. So
// "local AI" here is a LADDER, and which rung a device gets is decided by
// MEASURING it — never by sniffing the user agent, which lies in both
// directions (the Android "Chrome 140" string on a cheap phone hides a slow
// chip; the desktop string on a fast tablet hides nothing).
//
//   none   no typed arrays or Map → the deterministic engines, nothing lost.
//          Only engines older than ~2012 land here.
//   lite   ← THE RUNG THAT SHIPS, and it ships to everyone else. Pure JS, no
//          download, no WASM, no GPU: a fitted classifier over the app's own
//          curriculum (lib/local-model.ts) run in-process.
//   wasm   this device COULD run a small quantised neural model (WASM + SIMD
//          confirmed by actually validating a SIMD module, CPU clears the
//          floor, memory and storage adequate). NO MODEL IS BUNDLED.
//   gpu    this device COULD host a real on-device LLM (WebGPU adapter
//          present, or the browser's own built-in prompt API). NOTHING IS
//          BUNDLED.
//
// The two upper rungs are CAPABILITY REPORTS and the return values say so
// (`model: null`, `downloadKiB > 0`, and a `why` line that states the absence).
// They exist so that adding a model later is a data change — exactly like
// licensed exam papers in lib/question-bank.ts — not so a screenshot can look
// impressive today.
//
// THE OLD-DEVICE RULES, which are as much the feature as the model is:
//   · nothing is probed until the caller asks (`probeWhenIdle`), never at
//     import, so first paint is never spent on a capability audit;
//   · inference is capped per interaction by the device's own measured speed
//     (`maxBatchTokens`) and CHUNKED on slow ones, so a slow CPU can never
//     freeze the screen the learner is looking at;
//   · no bytes are fetched when the connection is metered or save-data is on,
//     even on a device that could host a bigger model.
// ─────────────────────────────────────────────────────────────────────────────

export type LocalTier = "none" | "lite" | "wasm" | "gpu";

export interface DeviceFacts {
  /** Typed arrays and Map — the floor for running anything here at all. */
  jsBasics: boolean;
  /** WebAssembly available at all (MVP, no SIMD implied). */
  wasm: boolean;
  /** WebAssembly SIMD, confirmed by validating a module that uses it. */
  simd: boolean;
  /** WebGPU adapter obtainable. */
  webgpu: boolean;
  /** navigator.hardwareConcurrency, 0 when unknown. */
  cores: number;
  /** navigator.deviceMemory in GB, or null when the browser refuses to say. */
  memoryGB: number | null;
  /** Fixed pure-JS workload, thousands of ops per millisecond. */
  kOpsPerMs: number;
  /** The learner is on a metered connection and asked us to be frugal. */
  saveData: boolean;
  /** Device is on low battery (see lib/power.ts) — do not spend cycles. */
  lowPower: boolean;
  /** Free storage in MB, or null when unknown. */
  storageMB: number | null;
}

/** The plan for one device. Everything the UI and the engines need to know. */
export interface LocalAiPlan {
  tier: LocalTier;
  /** Is on-device inference available right now, with no network? */
  ready: boolean;
  /** The model actually present on this device. Only "intent-nb" ever ships. */
  model: string | null;
  /** Bytes a network fetch would be required to get the NEXT tier's model.
   *  Zero means nothing needs downloading — which is the whole point of lite. */
  downloadKiB: number;
  /** Work permitted per interaction on THIS device, in tokens. */
  maxBatchTokens: number;
  /** Yield to the UI between batches (slow devices). */
  chunk: boolean;
  /** Measured reasons, in order — rendered in the ♿ panel and asserted in the
   *  harness, so a tier is never a mystery number. */
  why: string[];
}

// ── The budget rules ────────────────────────────────────────────────────────
// Every threshold is a claim about the learner's experience, so each one says
// what it protects.

// CALIBRATION, stated because a threshold nobody can check is a magic number:
// the fixed workload below reports ~2.6 million simple float ops/second-equivalent
// on the machine this was calibrated on (an Apple-silicon laptop, measured at
// ~2620 kOps/ms). A 2016 Cortex-A53 phone lands roughly 10–20× lower, around
// 130–260, which is why it never reaches an upper rung. These thresholds are
// PROXIES for "this CPU can decode a 4 MB model and run it inside a couple of
// seconds" — and they gate a rung that ships no model anyway, so a mis-set
// threshold costs a label today, not a broken lesson.

/** Below this, decoding + running a quantised model costs more wall-clock than
 *  the interaction it is meant to improve. The learner would rather wait for
 *  nothing. */
export const WASM_MIN_KOPS_PER_MS = 900;
/** WebGPU implies a modern chip, but an integrated GPU on a cheap Windows
 *  laptop is still slow — measure rather than assume. */
export const GPU_MIN_KOPS_PER_MS = 2500;
/** deviceMemory is coarse (0.25/0.5/1/2/4/8). A 1 GB phone that reports 2 will
 *  thrash and kill the browser tab if we let it allocate a model. */
export const UPPER_TIER_MIN_MEMORY_GB = 4;
export const UPPER_TIER_MIN_CORES = 4;
/** Free storage a model download would need, with headroom. A device whose
 *  storage is nearly full must never be sent one. */
export const UPPER_TIER_MIN_STORAGE_MB = 250;
/** The shipped classifier's ceiling. lib/local-model derives its own real
 *  footprint; the harness asserts it stays under this. */
export const LITE_MODEL_MAX_KIB = 96;
/** What a model per tier WOULD cost to fetch. Stated so the download gate has
 *  something concrete to refuse, and so nobody adds a 300 MB import by
 *  accident. */
export const MODEL_DOWNLOAD_KIB: Record<Exclude<LocalTier, "none" | "lite">, number> = {
  wasm: 4000,
  gpu: 320000,
};

/** Inference budget per interaction, from the device's measured speed. An
 *  ancient phone gets a small enough slice that the classification is still
 *  instant; a fast one gets headroom for longer messages. */
function batchBudget(kOpsPerMs: number): { maxBatchTokens: number; chunk: boolean } {
  if (kOpsPerMs >= 2000) return { maxBatchTokens: 6000, chunk: false };
  if (kOpsPerMs >= 900) return { maxBatchTokens: 3000, chunk: false };
  // From here down the device is slower than the calibration reference by more
  // than 3×: a pasted essay must be classified in slices rather than one block.
  if (kOpsPerMs >= 350) return { maxBatchTokens: 1200, chunk: true };
  if (kOpsPerMs >= 120) return { maxBatchTokens: 400, chunk: true };
  return { maxBatchTokens: 150, chunk: true };
}

/**
 * The tier decision, pure and total: same facts in, same plan out, no globals
 * and no I/O. That is what lets the harness exercise the whole space — every
 * combination of old and new device — instead of the one laptop it runs on.
 */
export function chooseTier(facts: DeviceFacts): LocalAiPlan {
  const why: string[] = [];
  const budget = batchBudget(facts.kOpsPerMs);

  if (!facts.jsBasics) {
    why.push("no-typed-arrays");
    return {
      tier: "none",
      ready: false,
      model: null,
      downloadKiB: 0,
      maxBatchTokens: 0,
      chunk: false,
      why,
    };
  }

  // LITE is the floor, and it needs no download, no WASM and no GPU. Everything
  // from here down is about ACCUMULATING reasons for the upper rungs, which is
  // why this branch is reached by almost every device ever made.
  why.push(`js-basics`, `measured-${Math.round(facts.kOpsPerMs)}k-ops-per-ms`);
  const base: LocalAiPlan = {
    tier: "lite",
    ready: true,
    model: "intent-nb",
    downloadKiB: 0,
    maxBatchTokens: budget.maxBatchTokens,
    chunk: budget.chunk,
    why,
  };

  const gpuCapable =
    facts.webgpu &&
    facts.kOpsPerMs >= GPU_MIN_KOPS_PER_MS &&
    (facts.memoryGB === null || facts.memoryGB >= UPPER_TIER_MIN_MEMORY_GB) &&
    facts.cores >= UPPER_TIER_MIN_CORES &&
    (facts.storageMB === null || facts.storageMB >= UPPER_TIER_MIN_STORAGE_MB) &&
    !facts.saveData &&
    !facts.lowPower;

  const wasmCapable =
    facts.wasm &&
    facts.simd &&
    facts.kOpsPerMs >= WASM_MIN_KOPS_PER_MS &&
    (facts.memoryGB === null || facts.memoryGB >= UPPER_TIER_MIN_MEMORY_GB) &&
    facts.cores >= UPPER_TIER_MIN_CORES &&
    (facts.storageMB === null || facts.storageMB >= UPPER_TIER_MIN_STORAGE_MB) &&
    !facts.saveData &&
    !facts.lowPower;

  if (facts.saveData) why.push("save-data-on");
  if (facts.lowPower) why.push("low-power");
  if (facts.memoryGB !== null && facts.memoryGB < UPPER_TIER_MIN_MEMORY_GB) why.push("small-memory");
  if (facts.cores && facts.cores < UPPER_TIER_MIN_CORES) why.push("few-cores");
  if (facts.storageMB !== null && facts.storageMB < UPPER_TIER_MIN_STORAGE_MB) why.push("low-storage");
  if (!facts.wasm) why.push("no-wasm");
  else if (!facts.simd) why.push("no-wasm-simd");
  if (!facts.webgpu) why.push("no-webgpu");

  // A capable device is reported as capable, but the model is ABSENT, and that
  // absence is stated in the plan rather than implied by silence.
  if (gpuCapable) {
    return { ...base, tier: "gpu", model: null, downloadKiB: MODEL_DOWNLOAD_KIB.gpu, why: [...why, "capable-of-on-device-llm", "no-model-bundled"] };
  }
  if (wasmCapable) {
    return { ...base, tier: "wasm", model: null, downloadKiB: MODEL_DOWNLOAD_KIB.wasm, why: [...why, "capable-of-small-neural-model", "no-model-bundled"] };
  }
  return base;
}

// ── Probing (browser only, deliberately lazy) ───────────────────────────────

/** A one-function WASM module whose body is `i32.const 7; i32x4.splat;
 *  i32x4.extract_lane 0`. It is hand-encoded because the ONLY honest test for
 *  SIMD is to hand an engine a SIMD module and see whether it accepts it —
 *  a feature string can be present while the code path is not. The plain
 *  module is the same shape without the SIMD instructions. */
const WASM_PLAIN: number[] = [
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // magic + version
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,       // type: () -> i32
  0x03, 0x02, 0x01, 0x00,                         // function: one, type 0
  0x07, 0x05, 0x01, 0x01, 0x70, 0x00, 0x00,       // export "p" func 0
  0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x2a, 0x0b, // code: i32.const 42; end
];

const WASM_SIMD: number[] = [
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
  0x03, 0x02, 0x01, 0x00,
  0x07, 0x05, 0x01, 0x01, 0x70, 0x00, 0x00,
  0x0a, 0x0b, 0x01, 0x09, 0x00, 0x41, 0x07, 0xfd, 0x11, 0xfd, 0x1b, 0x00, 0x0b,
];

/** The probe modules, exported so the harness can prove they are VALID WASM.
 *  A malformed probe would report "no WebAssembly" on every device in the
 *  world — a capability audit that silently answers no is worse than none. */
export const PROBE_MODULES = { plain: WASM_PLAIN, simd: WASM_SIMD };

function wasmAccepts(bytes: readonly number[]): boolean {
  try {
    const W = globalThis.WebAssembly as typeof WebAssembly | undefined;
    if (!W) return false;
    const mod = new Uint8Array(bytes);
    // One cast, and the reason for it: TypeScript's BufferSource unions
    // ArrayBufferLike (SharedArrayBuffer included) while every engine's
    // validate/Module takes an ordinary ArrayBuffer view — which is exactly
    // what `mod` is. The alternative is a lib workaround that hides a real
    // mismatch later.
    const src = mod as unknown as BufferSource;
    // validate() is the cheap honest path; Module() is the fallback for engines
    // that shipped validate late.
    if (typeof W.validate === "function") return W.validate(src);
    return Boolean(new W.Module(src));
  } catch {
    return false;
  }
}

/** A fixed workload — a dot product and a small polynomial — measured rather
 *  than assumed. Bounded so even a 2016 phone finishes it in a few frames.
 *
 *  KNOWN UNDERSTATEMENT: a hidden or backgrounded tab has its timers throttled
 *  and its share of the CPU reduced, so this reports a SLOWER number than the
 *  device can achieve. That errs in the safe direction — the ladder then says
 *  `lite`, which runs everywhere — but it means a "this device could run a
 *  larger model" reading should be treated as a floor, not a ceiling. Observed
 *  live: a desktop webview with WebGPU and 8 cores measured 426 kOps/ms while
 *  unfocused, against ~2620 for the same machine rendering in the foreground. */
function bench(): number {
  const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
  const a = new Float64Array(64);
  for (let i = 0; i < a.length; i++) a[i] = (i + 1) / 64;
  // Calibrate: aim for a measurable but brief run.
  const targetMs = 12;
  let iterations = 200;
  let elapsed = 0;
  do {
    const t0 = now();
    for (let r = 0; r < iterations; r++) {
      let acc = 0;
      for (let i = 0; i < a.length; i++) acc += a[i] * a[(i + r) % a.length] + i * 0.5;
      if (acc === Infinity) return 0; // never true; keeps the loop live
    }
    elapsed = now() - t0;
    if (elapsed >= targetMs) break;
    iterations *= 2;
    if (iterations > 200000) break;
  } while (true);
  if (elapsed <= 0) return 0;
  const opsPerMs = (iterations * a.length * 2) / elapsed;
  return Math.round(opsPerMs / 1000); // thousands of ops per ms
}

/** Measure THIS device. Async because two of the four probes are. Never called
 *  at import: see probeWhenIdle. */
export async function probeDevice(): Promise<DeviceFacts> {
  const nav = typeof navigator === "undefined" ? undefined : (navigator as Navigator & {
    deviceMemory?: number;
    gpu?: { requestAdapter(): Promise<unknown | null> };
    connection?: { saveData?: boolean };
  });
  const hasBasics = (() => {
    try {
      return typeof Map === "function" && typeof Float64Array === "function";
    } catch {
      return false;
    }
  })();

  const facts: DeviceFacts = {
    jsBasics: hasBasics,
    wasm: false,
    simd: false,
    webgpu: false,
    cores: nav?.hardwareConcurrency ?? 0,
    memoryGB: typeof nav?.deviceMemory === "number" ? nav.deviceMemory : null,
    kOpsPerMs: 0,
    saveData: nav?.connection?.saveData === true,
    lowPower: typeof document !== "undefined" && document.documentElement.classList.contains("low-power"),
    storageMB: null,
  };
  if (!hasBasics) return facts;

  facts.wasm = wasmAccepts(WASM_PLAIN);
  facts.simd = facts.wasm && wasmAccepts(WASM_SIMD);

  try {
    const est = await navigator.storage?.estimate?.();
    if (est && typeof est.quota === "number") {
      const free = est.quota - (est.usage ?? 0);
      facts.storageMB = Math.round(free / (1024 * 1024));
    }
  } catch { /* storage estimate is a courtesy; absence is handled */ }

  // Only ask for a GPU adapter when the device is otherwise a candidate: the
  // request is async and pointless on a phone that already failed on memory.
  const plausible =
    (facts.memoryGB === null || facts.memoryGB >= UPPER_TIER_MIN_MEMORY_GB) &&
    facts.cores >= UPPER_TIER_MIN_CORES;
  if (nav?.gpu && plausible) {
    try {
      facts.webgpu = Boolean(await nav.gpu.requestAdapter());
    } catch { /* no adapter is a normal answer, not an error */ }
  }

  facts.kOpsPerMs = bench();
  return facts;
}

/** Probe after the screen is usable. A capability audit must never be part of
 *  first paint on a slow device — it is a courtesy to the UI, not a
 *  requirement of the app. */
export function probeWhenIdle(): Promise<DeviceFacts> {
  const run = () => probeDevice();
  if (typeof window === "undefined") return Promise.resolve(emptyFacts());
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === "function") {
    return new Promise((resolve) => idle(() => { void run().then(resolve); }, { timeout: 3000 }));
  }
  return new Promise((resolve) => setTimeout(() => { void run().then(resolve); }, 400));
}

/** Server-side / no-browser facts: the deterministic engines, nothing claimed. */
export function emptyFacts(): DeviceFacts {
  return {
    jsBasics: false,
    wasm: false,
    simd: false,
    webgpu: false,
    cores: 0,
    memoryGB: null,
    kOpsPerMs: 0,
    saveData: false,
    lowPower: false,
    storageMB: null,
  };
}

/** i18n key for the one line the ♿ panel shows about this device. */
export function tierNoteKey(plan: LocalAiPlan): string {
  if (plan.tier === "none") return "ai.note.none";
  if (plan.model) return "ai.note.lite";
  return plan.tier === "gpu" ? "ai.note.gpu" : "ai.note.wasm";
}

/** Did we actually refuse a bigger model for a stated reason? Used by the UI
 *  to explain WHY a fast-looking phone is on the lite rung. */
export function refusedBiggerModel(plan: LocalAiPlan): boolean {
  return plan.tier === "lite" && plan.why.some((w) =>
    ["save-data-on", "low-power", "small-memory", "few-cores", "low-storage"].includes(w));
}
