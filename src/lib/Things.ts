import { Thing } from "./DataTypes";

export default class Things {
    data: Thing[] = [];

    add(thing: Thing) {
        this.data.push(thing);
    }

    getThingByID(id: number) {
        for (const thing of this.data) {
            if (thing.type == id) {
                return thing
            }
        }
    }
}