import { Client } from "Code/framework";
import SrcObject from "../baseobj";
import { Attributes } from "Code/shared/common/class/attributes";

/**
 * @class
 * @object
 * @augments SrcObject
 */
class DashPanel extends SrcObject {
    public Speed = 0
    public LockTime = 0
    public Data

    constructor(Object: Model) {
        super(Object)

        this.Data = Attributes<{ Speed: number, LockTime: number }>(Object)

        this.Speed = this.Data.Speed
        this.LockTime = this.Data.LockTime

        this.Connections.Add(this.Data("Speed").Connect(() => this.Speed = this.Data.Speed))
        this.Connections.Add(this.Data("LockTime").Connect(() => this.LockTime = this.Data.LockTime))
    }

    protected OnTouch(Client: Client) {
        Client.ResetObjectState()

        Client.Sound.Play("Object/DashPanel/Activate")

        Client.Angle = this.Root.GetPivot().Rotation

        const LookVector = Client.ToLocal(this.Root.GetPivot().LookVector)
        Client.Speed = Client.Speed.add(LookVector.mul(this.Speed))

        Client.Flags.DirectVelocity = false
        Client.Flags.LockTimer = math.ceil(this.LockTime * 60)
        Client.Position = this.Root.GetPivot().Position

        this.Debounce = 25
    }
}

export = DashPanel