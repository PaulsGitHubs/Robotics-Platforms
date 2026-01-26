🤝 Contributors
A big thank you to everyone contributing to the Robotics Platforms – Digital Twin IDE project.
This project exists because of the time, ideas, and work from developers around the world.

🧑‍💻 Core Contributors
1. Paul (Project Owner)
Repository maintainer
Original architecture & design direction
Provided initial codebase structure
Lead vision for robotics + AI + Digital Twin platform

2. Ezekiel Ochuko (Developer & Integrator)
Major contributor to rebuilding and restructuring the full platform
Implemented:
AI Action Engine
Code Editor execution pipeline
Improved UI (editor.js, ui.js, main.js)
Sensor system integration
3D model upload backend (Flask)
Cesium-based Digital Twin improvements
Documentation, README, system organization, open-source preparation
Fixes, cleanup, debugging & modernization of codebase
Feature expansions and architecture consistency

3. Tchinda Jordan (Developer & Repo Maintainer & Researcher)
Major contributor to session management, sensor systems, and platform architecture
Implemented:
Complete session management system with IndexedDB persistence
- Created session storage layer with CRUD operations (create, read, update, delete sessions)
- Implemented session manager with auto-save functionality (30-second intervals)
- Built comprehensive session UI with search, filtering, and session switching
- Designed lightweight state serialization for camera, entities, editor, and scene settings
- Comprehensive documentation suite (SESSION_MANAGEMENT.md, SESSION_QUICKSTART.md, IMPLEMENTATION_SUMMARY.md)
- Full test suite with 5 automated tests for session functionality

Functional sensor simulation system with real-time telemetry
- Architected sensor engine with Cesium clock integration for synchronized updates
- Implemented 5 functional sensor classes with real physics:
  * LiDAR: 16-ray raycasting distance measurements with terrain detection
  * Ultrasonic: Single-ray distance sensor with range detection
  * Proximity: Spatial entity detection within configurable radius
  * Temperature: Altitude-based atmospheric temperature calculation
  * Pressure: Barometric pressure using exponential altitude formula
- Created sensor telemetry panel with live data visualization and throttled updates
- Implemented drag-and-drop sensor creation with full scene integration
- Added animated telemetry UI with flowing gradients, shimmer effects, and data pulse animations
- Designed simulation controls (start/stop/clear) with real-time sensor registration

3D Objects Router implementation
Repository refactoring and maintenance
Defined and structured main README
Multiple bug fixes and system improvements
Code architecture consistency and modernization


🌍 Community Contributors
Name	Contribution
(Your name here)	Open an issue or pull request to be added
To be added to this list, simply submit a pull request or contact the maintainers.

📌 How to Contribute
We welcome contributions!
Here’s how you can help:

✔ Add new sensors
✔ Improve physics simulations
✔ Add AI action rules
✔ Add 3D object tools or converters
✔ Fix bugs and improve performance
✔ Improve documentation
✔ Add tutorials and examples
Check the README for guidelines on how to set up the environment.

📝 Contribution Rules
To keep the code clean and maintainable:
Create a new branch:
git checkout -b feature-name

Follow clear commit messages:
feat: add Lidar sensor module
fix: resolve physics loader error
docs: update README with new features
Submit a pull request and describe your changes clearly.

📫 Contact
For discussions or questions, open a GitHub Issue or Discussion.