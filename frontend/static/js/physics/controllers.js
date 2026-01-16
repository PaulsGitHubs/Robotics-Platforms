export function attachKeyboardController(body) {
  window.addEventListener('keydown', (e) => {
    const input = { id: body.id, key: e.key, ts: Date.now() };
    try {
      if (window.__physicsNetwork) {
        window.__physicsNetwork.sendInput(input);
      }
    } catch (err) {}

    // Local prediction for immediate feedback
    if (e.key === 'w') body.velocity.y += 2;
    if (e.key === 's') body.velocity.y -= 2;
    if (e.key === 'a') body.velocity.x -= 2;
    if (e.key === 'd') body.velocity.x += 2;
    if (e.key === ' ') body.velocity.z += 6;
  });
}
