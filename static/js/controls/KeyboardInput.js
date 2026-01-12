export function bindKeyboard(entity) {
  window.addEventListener("keydown", e => {
    if (e.key === "w") entity.walk?.();
    if (e.key === "s") entity.stop?.();
  });
}
