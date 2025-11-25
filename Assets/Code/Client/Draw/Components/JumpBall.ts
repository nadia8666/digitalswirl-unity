import Client from "Code/Client/Client"

@AirshipComponentMenu("Draw/JumpBall")
export default class JumpBall extends AirshipBehaviour {
    @NonSerialized() public Enabled = true
    private Rotation = 0
    public Material: Material
    public RPM = 300
    private RPS = 360 * (this.RPM / 60)

    public Quills: MeshRenderer
    public Smear: MeshRenderer
    public QuillMesh: MeshFilter
    public SmearMesh: MeshFilter

    public StretchCurve: AnimationCurve
    public RotationSpeedCurve: AnimationCurve

    override Start() {
        if ($CLIENT) {
            this.SetEnabled(false)
        }
    }

    public Destroy() { // fix eventually
        this.Material.SetFloat("_Stretch", 1)
        this.Material.SetFloat("_Alpha", 1)
        this.Material.SetFloat("_Spin", 0)
    }

    public SetEnabled(Enabled: boolean) {
        if (this.Enabled !== Enabled) {
            this.Enabled = Enabled

            this.gameObject.SetActive(Enabled)
        }
    }

    public Draw(Client: Client, DeltaTime: number) {
        if (this.Enabled) {
            const SpinSpeed = Client.Animation.GetRate()
            const RotationSpeed = this.RotationSpeedCurve.Evaluate(math.clamp01(SpinSpeed / 20))

            this.Rotation += DeltaTime * this.RPS * RotationSpeed
            this.Rotation %= 360

            this.transform.rotation = Client.transform.rotation.mul(Quaternion.Euler(-this.Rotation, 180, 0))
            this.transform.localPosition = new Vector3(0, Client.Ground.Grounded ? Client.Config.JumpBallHeightRoll : Client.Config.JumpBallHeightAir, 0)

            const Stretch = this.StretchCurve.Evaluate(Client.Flags.JumpStretchTimer / Client.Config.JumpStretchTimer) * Client.Config.JumpBallStretch
            this.Material.SetFloat("_Stretch", 1 + Stretch)
            this.Material.SetFloat("_Alpha", RotationSpeed)
            this.Material.SetFloat("_Spin", -RotationSpeed * 30)
        }
    }
}