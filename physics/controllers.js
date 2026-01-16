export function attachKeyboardController(body) {
  window.addEventListener("keydown", e => {
    if (e.key === "w") body.velocity.y += 2;
    if (e.key === "s") body.velocity.y -= 2;
    if (e.key === "a") body.velocity.x -= 2;
    if (e.key === "d") body.velocity.x += 2;
    if (e.key === " ") body.velocity.z += 6;
  });
}
