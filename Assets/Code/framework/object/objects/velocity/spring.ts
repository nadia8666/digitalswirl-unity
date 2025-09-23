import { Client } from "Code/framework";
import SrcObject from "../baseobj";
import { Attributes } from "Code/shared/common/class/attributes";
import { FromToRotation } from "Code/shared/common/utility/cfutil";

/**
 * @class
 * @object
 * @augments SrcObject
 */
class Spring extends SrcObject {
    public Force = 0
    public LockTime = 0
    public DirectVelocity = false
    public Wide = false
    public Data

    constructor(Object: Model) {
        super(Object)

        this.Data = Attributes<{ Force: number, LockTime: number, DirectVelocity: boolean, Wide: boolean }>(Object)

        this.Force = this.Data.Force
        this.LockTime = this.Data.LockTime
        this.DirectVelocity = this.Data.DirectVelocity
        this.Wide = this.Data.Wide

        this.Connections.Add(this.Data("Force").Connect(() => this.Force = this.Data.Force))
        this.Connections.Add(this.Data("LockTime").Connect(() => this.LockTime = this.Data.LockTime))
        this.Connections.Add(this.Data("DirectVelocity").Connect(() => this.DirectVelocity = this.Data.DirectVelocity))
        this.Connections.Add(this.Data("Wide").Connect(() => this.Wide = this.Data.Wide))
    }

    protected OnTouch(Client: Client) {
        Client.ResetObjectState()

        Client.Speed = new Vector3(0, this.Force, 0)

        Client.Sound.Play("Object/Spring/Activate")

        if (this.Wide) {
            const Offset = this.Root.CFrame.PointToObjectSpace(Client.Position)

            Client.Position = this.Root.CFrame.PointToWorldSpace(new Vector3(math.clamp(Offset.X, -this.Root.Size.X / 2, this.Root.Size.X / 2), 0, 0))
        } else {
            Client.Position = this.Root.Position
        }

        if (math.abs(this.Root.CFrame.UpVector.Dot(Client.Flags.Gravity.Unit)) >= .95) {
            Client.Angle = FromToRotation(Client.Angle.UpVector, this.Root.CFrame.UpVector).mul(Client.Angle)
        } else {
            Client.Angle = this.Root.GetPivot().Rotation
        }

        Client.Flags.DirectVelocity = this.DirectVelocity
        Client.Flags.LockTimer = math.ceil(this.LockTime * 60)
        Client.Flags.AirKickEnabled = true
        Client.State.Current = Client.State.States.Airborne
        Client.Animation.Current = "SpringStart"
        Client.Ground.Grounded = false

        this.Debounce = 6
    }
}

export = Spring