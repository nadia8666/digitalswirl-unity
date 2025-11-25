import Client from "Code/Client/Client"
import { SingleDimensionSpring } from "Code/Shared/Common/SingleDimensionSpring"
import { DrawInformation } from "Code/Shared/Types"

@AirshipComponentMenu("Draw/SpindashBall")
export default class SpindashBall extends AirshipBehaviour {
    @NonSerialized() public Enabled = true
    private Rotation = 0
    public RPM = 300
    private RPS = 360 * (this.RPM / 60)

    private YRotation = new SingleDimensionSpring(0, 0, 0, 90, 2, .985, true)
    private Stretch = new SingleDimensionSpring(0, 0, 0, 1.5, 2, .98)

    override Start() {
        if ($CLIENT) {
            this.SetEnabled(false)
        }
    }

    public SetEnabled(Enabled: boolean, DrawInfo?: DrawInformation) {
        if (this.Enabled !== Enabled) {
            this.Enabled = Enabled

            if (Enabled && DrawInfo) {
                this.YRotation.Update(0, DrawInfo.Rotation.eulerAngles.y, true)
                this.Stretch.Update(0, 1.2, true)
            }

            this.gameObject.SetActive(Enabled)
        }
    }

    public Draw(DeltaTime: number, DrawInfo: DrawInformation) {
        if (this.Enabled) {
            this.YRotation.Update(DeltaTime, DrawInfo.Rotation.eulerAngles.y)
            this.Stretch.Update(DeltaTime, 1)

            const RotationSpeed = DrawInfo.SpindashSpeed

            this.Rotation += DeltaTime * this.RPS * RotationSpeed
            this.Rotation %= 360

            this.transform.rotation = DrawInfo.Rotation.mul(Quaternion.Euler(0, 180, 0))
            this.transform.localPosition = new Vector3(0, DrawInfo.JumpBallHeight, 0)

            this.Block.SetFloat("_Stretch", this.Stretch.CurrentValue)
            this.Block.SetFloat("_Spin", -RotationSpeed * 30)
            this.Block.SetFloat("_Rotation", -this.Rotation)
            this.Block.SetFloat("_YRotationEuler", this.YRotation.CurrentValue)

            this.ApplyBlock()
        }
    }

    public Block = new MaterialPropertyBlock()
    public Parts: MeshRenderer[] = []
    public ApplyBlock() {
        for (const [_, Mesh] of pairs(this.Parts)) {
            Mesh.SetPropertyBlock(this.Block)
        }
    }
}