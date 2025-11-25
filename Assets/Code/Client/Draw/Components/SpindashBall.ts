import { Spring } from "@Easy/Core/Shared/Util/Spring"
import Client from "Code/Client/Client"
import { SingleDimensionSpring } from "Code/Shared/Common/SingleDimensionSpring"

@AirshipComponentMenu("Draw/SpindashBall")
export default class SpindashBall extends AirshipBehaviour {
    @NonSerialized() public Enabled = true
    private Rotation = 0
    public Material: Material
    public RPM = 300
    private RPS = 360 * (this.RPM / 60)
    public RotationSpeedCurve: AnimationCurve
    private YRotation = new SingleDimensionSpring(0, 0, 0, 90, 2, .985, true)
    private Stretch = new SingleDimensionSpring(0, 0, 0, 1.5, 2, .98)

    override Start() {
        if ($CLIENT) {
            this.SetEnabled(false)
        }
    }

    public Destroy() { // fix eventually
        this.Material.SetFloat("_Stretch", 1)
        this.Material.SetFloat("_Spin", 0)
    }

    public SetEnabled(Enabled: boolean, Client?: Client) {
        if (this.Enabled !== Enabled) {
            this.Enabled = Enabled

            if (Enabled && Client) {
                this.YRotation.Update(0, Client.transform.rotation.eulerAngles.y, true)
                this.Stretch.Update(0, 1.2, true)
            }

            this.gameObject.SetActive(Enabled)
        }
    }

    public Draw(Client: Client, DeltaTime: number) {
        if (this.Enabled) {
            this.YRotation.Update(DeltaTime, Client.transform.rotation.eulerAngles.y)
            this.Stretch.Update(DeltaTime, 1)

            const RotationSpeed = this.RotationSpeedCurve.Evaluate(math.clamp01(Client.Flags.SpindashSpeed / 10) + .15)

            this.Rotation += DeltaTime * this.RPS * RotationSpeed
            this.Rotation %= 360

            this.transform.rotation = Client.transform.rotation.mul(Quaternion.Euler(0, 180, 0))
            this.transform.localPosition = new Vector3(0, Client.Config.JumpBallHeightRoll, 0)

            this.Material.SetFloat("_Stretch", this.Stretch.CurrentValue)
            this.Material.SetFloat("_Spin", -RotationSpeed * 30)
            this.Material.SetFloat("_Rotation", -this.Rotation)
            this.Material.SetFloat("_YRotationEuler", this.YRotation.CurrentValue)
        }
    }
}