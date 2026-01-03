class EntityState:
    def __init__(self, entity_id, entity_type):
        self.id = entity_id
        self.type = entity_type
        self.position = {"x": 0, "y": 0, "z": 0}
        self.velocity = {"x": 0, "y": 0, "z": 0}
        self.status = "idle"
