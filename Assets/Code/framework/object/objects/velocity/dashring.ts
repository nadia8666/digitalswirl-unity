import { Client } from "Code/framework";
import SrcObject from "../baseobj";
import { Attributes } from "Code/shared/common/class/attributes";

/**
 * @class
 * @object
 * @augments SrcObject
 */
class DashRing extends SrcObject {
    public Speed = 0
    public LockTime = 0
    public Rainbow = false
    public Data

    constructor(Object: Model) {
        super(Object)
        this.Data = Attributes<{ Speed: number, LockTime: number, Rainbow: boolean }>(Object)

        this.Speed = this.Data.Speed
        this.LockTime = this.Data.LockTime
        this.Rainbow = this.Data.Rainbow

        this.Connections.Add(this.Data("Speed").Connect(() => this.Speed = this.Data.Speed))
        this.Connections.Add(this.Data("LockTime").Connect(() => this.LockTime = this.Data.LockTime))
        this.Connections.Add(this.Data("Rainbow").Connect(() => this.Rainbow = this.Data.Rainbow))

        //TODO: animation
    }

    protected OnTouch(Client: Client) {
        Client.ResetObjectState()

        Client.Sound.Play(`Object/${this.Rainbow ? "Rainbow" : "Dash"}Ring/Activate`)

        Client.Speed = new Vector3(this.Speed, 0, 0)
        Client.Angle = this.Root.GetPivot().Rotation
        Client.Position = this.Root.GetPivot().Position
        Client.Flags.DirectVelocity = true
        Client.Flags.LockTimer = math.ceil(this.LockTime * 60)
        Client.State.Current = Client.State.States.Airborne
        Client.Ground.Grounded = false

        this.Debounce = 25
    }
}

export = DashRing