class SimulationState:
    def __init__(self):
        self.entities = {}

    def add_entity(self, entity):
        self.entities[entity.id] = entity

    def tick(self, delta):
        for entity in self.entities.values():
            entity.position["x"] += entity.velocity["x"] * delta
