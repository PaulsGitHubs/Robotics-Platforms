export function handleAIVehicleCommand(command, vehicle) {
  if (command.includes("brake") || command.includes("stop")) {
    vehicle.brake();
  }
}
