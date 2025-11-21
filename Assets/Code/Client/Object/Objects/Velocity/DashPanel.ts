import _OBJBase from "../Base"
import Client from "Code/Client/Client"

@AirshipComponentMenu("Object/DashPanel")
export default class _OBJDashPanel extends _OBJBase {
    public Velocity = 6
    public LockTime = 0

    override OnTouch(Client: Client) {
        Client.ResetObjectState()

        Client.Speed = Client.Speed.WithX(this.Velocity)

        Client.Sound.Play("Object/DashPanel/Activate.mp3")

        const Offset = this.Collider.transform.InverseTransformPoint(Client.Position)

        Client.Position = this.Collider.transform.TransformPoint(Vector3.forward.mul(Offset.z))
        Client.Angle = this.Collider.transform.rotation

        Client.Flags.LockTimer = math.ceil(this.LockTime * 60)

        Client.State.Current = Client.State.States.Grounded
        Client.Ground.Grounded = true

        this.Debounce = 6
    }
}