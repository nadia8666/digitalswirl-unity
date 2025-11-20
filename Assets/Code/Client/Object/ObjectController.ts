import { Constants } from "Code/Shared/Common/Constants"
import Client from "../Client"
import _OBJBase from "./Objects/Base"

const Objects = new Map<BoxCollider, _OBJBase>()

export class ObjectController {
    private Client

    constructor(Client: Client) {
        this.Client = Client
    }

    public CheckCollide(Collider: BoxCollider, Object: _OBJBase) {
        // todo: this better. like the spatial module but doesnt error at big range
        const Center = Collider.transform.TransformPoint(Collider.center)
        if (Center.sub(this.Client.Position).magnitude <= Collider.size.magnitude * 3) {
            const [Min, Max] = [Center.sub(Collider.size), Center.add(Collider.size)]
            const Pos = this.Client.Position

            if (Min.x <= Pos.x && Min.y <= Pos.y && Min.z <= Pos.z && Max.x >= Pos.x && Max.y >= Pos.y && Max.z >= Pos.z) {
                Object.TouchClient(this.Client)

                return true
            }
        }

        return false
    }

    public CollideWithClient() {
        const LastPosition = this.Client.LastCFrame.Position
        if (LastPosition !== this.Client.Position) {
            const Look = this.Client.Position.sub(LastPosition)
            const [Cast, _1, _2, Collider] = Physics.SphereCast(LastPosition, this.Client.Physics.Radius, Look.normalized, Look.magnitude, Constants.ObjectLayer)

            if (Cast) {
                const Object = Objects.get(Collider as BoxCollider)

                Object?.TouchClient(this.Client)
            }

        }

        for (const [Collider, Object] of Objects) {
            this.CheckCollide(Collider, Object)
        }
    }

    public TickObjects() {
        for (const [_, Object] of Objects) {
            Object.Tick(() => {
                return this.Client
            })
        }
    }
}

export function RegisterObject(Class: _OBJBase) {
    Objects.set(Class.Collider, Class)
}