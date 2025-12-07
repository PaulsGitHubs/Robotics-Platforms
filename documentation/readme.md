Digital Twin IDE — Robotics Platforms

This project is an interactive browser-based Digital Twin IDE built with:

CesiumJS (3D Earth + simulation engine)

JavaScript ES Modules

Flask (Python backend)

OpenAI API (AI-assisted camera control, code generation)

Modular sensor system

Code editor (CodeMirror)

🚀 Features
✅ 3D Digital Twin Viewer

Based on CesiumJS

Real-time camera control

Entity placement and dynamic object loading

✅ Code Editor

CodeMirror-powered

“Run” executes JavaScript directly into the simulation

LocalStorage script saving

✅ AI Integration

Users can type:

“Fly to New York”

“Add point at 50.33, 8.55”

“Run this: viewer.camera.flyHome();”

Backend uses:

OpenAI API → AIEngine → /ai_query → AI Actions → scene.js


AI outputs raw JavaScript which is executed inside the IDE.

✅ Sensors System

Drag-and-drop:

Ultrasonic

Radar

LiDAR

Proximity

Temperature

Humidity

Pressure

Each sensor extends a SensorBase class and can be placed onto the globe.

✅ Future Support (Placeholders Done)

Physics engine (collision, forces, movement)

3D object upload system

User model storage & syncing

Custom entity behavior

📁 Project Structure
Robotics-Platforms/
│
├── Server_Host.py
├── README.md
├── LICENSE
│
├── templates/
│   └── digital_twin.html
│
├── static/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── scene.js
│   │   ├── ui.js
│   │   ├── editor.js
│   │   ├── entities.js
│   │   ├── file_manager.js
│   │   ├── properties_panel.js
│   │   ├── utils.js
│   │   ├── config.js
│   │
│   │   ├── ai/
│   │   │   ├── openai_client.js
│   │   │   ├── ai_actions.js
│   │   │   ├── prompt_templates.js
│   │   │   └── realtime_client.js
│   │
│   │   ├── sensors/
│   │   │   ├── SensorBase.js
│   │   │   ├── sensor_factory.js
│   │   │   ├── sensor_dragdrop.js
│   │   │   ├── Ultrasonic.js
│   │   │   ├── Radar.js
│   │   │   ├── LiDAR.js
│   │   │   ├── Proximity.js
│   │   │   ├── Temperature.js
│   │   │   ├── Humidity.js
│   │   │   ├── Pressure.js
│   │   │   ├── realtime_ws.js
│   │   │   └── realtime_mqtt.js (optional)
│
├── sensors_peripherals_range/
│   └── sensor_parameter_configuration.js
│
├── physics/
│   └── physics.js
│
├── ai_integration/
│   └── ai_integration.py
│
└── demos/
    ├── circuit1.gif
    └── digitaltwin-simul.gif

🧠 AI Query Example
Fly to the Eiffel Tower


AI returns:

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(2.2945, 48.8584, 3000)
});
run this


→ Camera moves instantly.

🛠 Run Locally
Install
pip install flask openai python-dotenv
npm install

Set environment

Create .env:

OPENAI_API_KEY=your_api_key
CESIUM_ION_TOKEN=your_cesium_token

Start
python Server_Host.py


Go to:

http://127.0.0.1:5000

📌 Notes

Physics and 3D upload systems are prepared but not implemented (following project scope).

Modules are fully ES module compatible.

All errors (import/export, camera commands, sensors) are resolved in this build.

🤝 Contributing
We welcome contributions!
Contributors can:
Add new sensors
Add physics modules
Add new AI actions
Improve the 3D asset pipeline
Add simulations & robot models
Fork repository
Create a new branch
Submit pull request
👨‍🎓 Author

Ezekiel Ochuko — Robotics Platforms 
Completed with AI integration, drag-drop sensors, and working Cesium IDE.
