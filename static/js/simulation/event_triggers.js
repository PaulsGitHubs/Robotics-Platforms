export function applyCheckpoint(vehicle, distance) {
  if (!vehicle || typeof vehicle.brake !== "function") return;

  if (distance < 8 && !vehicle.isStopped) {
    vehicle.brake();
    vehicle.isStopped = true;
    console.log("Checkpoint reached → braking");
  }
}

export function policeStopTrigger(vehicle, police, distance) {
  if (!vehicle || !police) return;
  if (typeof vehicle.brake !== "function") return;

  if (distance < 10 && police.isStoppingTraffic && !vehicle.isStopped) {
    vehicle.brake();

    // Safe velocity stop
    if (vehicle.velocity) {
      vehicle.velocity.x = 0;
      vehicle.velocity.y = 0;
      vehicle.velocity.z = 0;
    }

    vehicle.isStopped = true;
    console.log("Police stop → vehicle halted");
  }
}
