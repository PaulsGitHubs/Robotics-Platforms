# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - text: html lang="en">
  - generic [ref=e2]:
    - combobox "Search location..." [ref=e3]
    - button "Search" [ref=e4]
    - button "Start Simulation" [ref=e5]
    - button "Stop" [ref=e6]
    - button "Toggle Physics Debug" [ref=e7]
    - text: "Model:"
    - combobox "Model:" [ref=e8]:
      - 'option "Car: Sedan" [selected]'
      - 'option "Car: Police"'
      - 'option "Aircraft: Airplane"'
      - option "Satellite"
      - option "Sensor"
    - button "Place Object" [ref=e9]
    - button "Load 3D Buildings" [ref=e10]
    - button "Label Nearby" [ref=e11]
```