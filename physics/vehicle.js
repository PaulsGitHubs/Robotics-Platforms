export function createVehicle(body, options = {}) {
  body.engineForce = options.engineForce ?? 800;
  body.brakeForce = options.brakeForce ?? 300;
  body.steeringAngle = 0;

  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") body.velocity.y += body.engineForce * 0.001;
    if (e.key === "ArrowDown") body.velocity.y -= body.brakeForce * 0.001;
    if (e.key === "ArrowLeft") body.velocity.x -= 0.5;
    if (e.key === "ArrowRight") body.velocity.x += 0.5;
  });
}
