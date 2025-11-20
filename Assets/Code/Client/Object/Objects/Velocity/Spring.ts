import { CFrame } from "Code/Shared/Types"
import _OBJBase from "../Base"
import Client from "Code/Client/Client"

@AirshipComponentMenu("Object/Spring")
export default class _OBJSpring extends _OBJBase {
    public Velocity = new Vector3(0, 2, 0)
    public Wide = false
    public ForceAngle = false
    public DirectVelocity = false
    public LockTime = 0

    override OnTouch(Client: Client) {
        Client.ResetObjectState()

        Client.Speed = this.Velocity

        Client.Sound.Play("Object/Spring/Activate.wav")

        if (this.Wide) {
            const Offset = this.gameObject.transform.InverseTransformPoint(Client.Position)

            Client.Position = this.gameObject.transform.TransformPoint(new Vector3(math.clamp(Offset.x, -this.Collider.size.x / 2, this.Collider.size.x / 2), 0, 0))
        } else {
            Client.Position = this.gameObject.transform.TransformPoint(this.Collider.center)
        }

        if (math.abs(this.gameObject.transform.up.Dot(Client.Flags.Gravity.normalized)) >= .95) {
            Client.Angle = CFrame.FromRotationBetweenVectors(Client.Angle.mul(Vector3.up), this.gameObject.transform.up).mul(Client.Angle)
        } else {
            Client.Angle = this.gameObject.transform.rotation
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