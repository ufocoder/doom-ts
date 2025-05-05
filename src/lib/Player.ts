export default class Player {
  ID: number;
  x: number = 0;
  y: number = 0;
  angle: number = 0;

  moveSpeed = 2;
  rotationSpeed = 4;

  constructor(ID: number) {
    this.ID = ID;
  }

  setXPosition(x: number) {
    this.x = x;
  }

  setYPosition(y: number) {
    this.y = y;
  }

  setAngle(angle: number) {
    this.angle = angle;
  }

  getID() {
    return this.ID;
  }

  getXPosition() {
    return this.x;
  }

  getYPosition() {
    return this.y;
  }

  getAngle() {
    return this.angle;
  }
}
