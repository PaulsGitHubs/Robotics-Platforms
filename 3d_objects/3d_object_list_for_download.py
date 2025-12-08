# 3D Objects Folder

This folder stores user-uploaded `.glb`, `.gltf`, `.obj`, `.fbx`, or `.dae` files.

In future deployment:
- Users will upload objects through a Flask route.
- Paths will be saved to a list or database.
- Server will sync files so all users can load them.

### Example JSON List
[
  ["https://www.roboticsplatforms.com/digital_twin/car.glb", "Car"],
  ["https://www.roboticsplatforms.com/digital_twin/house.glb", "House"]
]

### Local Development Path Example
- http://localhost:5000/3d_objects/drone.glb

This folder is currently a placeholder for future development.
