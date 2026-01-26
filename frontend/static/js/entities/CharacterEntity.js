import BaseEntity from "./BaseEntity.js";

export default class CharacterEntity extends BaseEntity {
  walk() {
    this.velocity.x = 1;
  }
}

