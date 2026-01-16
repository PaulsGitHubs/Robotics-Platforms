let last = performance.now();

export function getDeltaTime() {
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;
  return dt;
}
