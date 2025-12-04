// Sensor Parameters Configuration
const sensorParameters = {
  Ultrasonic: {
    type: "cone",
    description: "Measures distance using ultrasonic sound waves",
    minRange: 0.1,
    maxRange: 10,
    defaultRange: 5,
    minFov: 5,
    maxFov: 60,
    defaultFov: 30,
    unit: "m",
    color: "#00a8ff"
  },
  Radar: {
    type: "cone",
    description: "Radio detection and ranging system",
    minRange: 1,
    maxRange: 1000,
    defaultRange: 500,
    minFov: 1,
    maxFov: 45,
    defaultFov: 15,
    unit: "m",
    color: "#ff9f1c"
  },
  LiDAR: {
    type: "cone",
    description: "Light detection and ranging system",
    minRange: 0.5,
    maxRange: 200,
    defaultRange: 100,
    minFov: 0.5,
    maxFov: 30,
    defaultFov: 10,
    unit: "m",
    color: "#2ecc71"
  },
  Proximity: {
    type: "sphere",
    description: "Detects objects within a spherical range",
    minRange: 0.1,
    maxRange: 50,
    defaultRange: 10,
    unit: "m",
    color: "#9b59b6"
  },
  Temperature: {
    type: "point",
    description: "Measures ambient temperature",
    color: "#e74c3c"
  },
  Humidity: {
    type: "point",
    description: "Measures relative humidity",
    color: "#3498db"
  },
  Pressure: {
    type: "point",
    description: "Measures atmospheric pressure",
    color: "#1abc9c"
  }
};
