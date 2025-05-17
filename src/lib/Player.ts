import { Angle } from "./Angle";
import { Thing, Vertex } from "./DataTypes";

export default class Player {
  ID: number;
  x: number = 0;
  y: number = 0;
  z: number = 40;
  angle: Angle = new Angle(0);
  FOV: Angle = new Angle(90);
  halfFOV: Angle = new Angle(45);

  moveSpeed = 10;
  rotationSpeed = 15;

  constructor(ID: number) {
    this.ID = ID;
  }

  init(thing?: Thing) {
    if (!thing) {
      return;
    }
    this.x = thing.x;
    this.y = thing.y;
    this.angle = new Angle(thing.angle);
  }

  setXPosition(x: number) {
    this.x = x;
  }

  setYPosition(y: number) {
    this.y = y;
  }

  setAngle(angle: number) {
    this.angle = new Angle(angle);
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

  getZPosition() {
    return this.z;
  }

  setZPosition(z: number) {
    this.z = z;
  }

  getAngle() {
    return this.angle;
  }

  getFOV() {
    return this.FOV.getValue();
  }

  angleToVertex(vertex: Vertex): Angle {
    const dx = vertex.x - this.x;
    const dy = vertex.y - this.y;

    return new Angle((Math.atan2(dy, dx) * 180) / Math.PI);
  }

  distanceToPoint(v: Vertex) {
    return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
  }

  clipVertexesInFOV(v1: Vertex, v2: Vertex) {
    let V1Angle = this.angleToVertex(v1);
    let V2Angle = this.angleToVertex(v2);

    const v1ToV2Span = V1Angle.subtract(V2Angle);

    if (v1ToV2Span.greaterThan(this.FOV.getValue() * 2)) {
      return;
    }

    let V1AngleFromPlayer = V1Angle.subtract(this.angle);
    let V2AngleFromPlayer = V2Angle.subtract(this.angle);

    const v1Moved = V1AngleFromPlayer.add(this.halfFOV);

    if (v1Moved.greaterThan(this.FOV)) {
      const v1MovedAngle = v1Moved.subtract(this.FOV);
      if (v1MovedAngle.greaterThanOrEqual(v1ToV2Span)) {
        return;
      }
      V1AngleFromPlayer = this.halfFOV;
    }

    const v2Moved = this.halfFOV.subtract(V2AngleFromPlayer);

    if (v2Moved.greaterThan(this.FOV)) {
      V2AngleFromPlayer.assign(this.halfFOV.negate());
    }

    V1AngleFromPlayer.addAssign(this.FOV.getValue());
    V2AngleFromPlayer.addAssign(this.FOV.getValue());

    return {
      V1Angle,
      V2Angle,
      V1AngleFromPlayer,
      V2AngleFromPlayer
    };
  }

  moveForward() {
    this.x += this.angle.getCosValue() * this.moveSpeed;
    this.y += this.angle.getSinValue() * this.moveSpeed;
  }

  moveLeftward() {
    this.x -= this.angle.getCosValue() * this.moveSpeed;
    this.y -= this.angle.getSinValue() * this.moveSpeed;
  }

  rotateLeft() {
    this.angle.addAssign(0.1875 * this.rotationSpeed);
  }

  rotateRight() {
    this.angle.subtractAssign(0.1875 * this.rotationSpeed);
  }

  fly() {
    this.z += 1;
  }

  sink() {
    this.z -= 1;
  }
}
