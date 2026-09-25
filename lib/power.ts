// Electricity-aware + data-saver foundations (§6).
// Battery <15% or Save-Data → html.low-power: no animations, no big images.
export function useLowPower(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return true;
  } catch { /* ignore */ }
  return document.documentElement.classList.contains("low-power");
}

export function watchPower(): () => void {
  if (typeof window === "undefined") return () => {};
  let cancelled = false;
  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; addEventListener: (e: string, f: () => void) => void }> };
    if (nav.getBattery) {
      nav.getBattery().then((b) => {
        if (cancelled) return;
        const apply = () => {
          if (b.level <= 0.15) document.documentElement.classList.add("low-power");
        };
        apply();
        b.addEventListener("levelchange", apply);
      }).catch(() => {});
    }
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) document.documentElement.classList.add("low-power");
  } catch { /* never break learning for a power probe */ }
  const onOnline = () => {};
  window.addEventListener("online", onOnline);
  return () => { cancelled = true; window.removeEventListener("online", onOnline); };
}
