import Client from "Code/Client/Client"
import { DrawInformation } from "Code/Shared/Types"

@AirshipComponentMenu("Draw/JumpBall")
export default class JumpBall extends AirshipBehaviour {
    @NonSerialized() public Enabled = true
    private Rotation = 0
    public RPM = 300
    private RPS = 360 * (this.RPM / 60)

    override Start() {
        if ($CLIENT) {
            this.SetEnabled(false)
        }
    }
    
    public SetEnabled(Enabled: boolean) {
        if (this.Enabled !== Enabled) {
            this.Enabled = Enabled
            
            this.gameObject.SetActive(Enabled)
        }
    }
    
    public Draw(DeltaTime: number, DrawInfo: DrawInformation) {
        if (this.Enabled) {
            const RotationSpeed = DrawInfo.JumpBallSpeed
            
            this.Rotation += DeltaTime * this.RPS * RotationSpeed
            this.Rotation %= 360
            
            this.transform.rotation = DrawInfo.Rotation.mul(Quaternion.Euler(-this.Rotation, 180, 0))
            this.transform.localPosition = new Vector3(0, DrawInfo.JumpBallHeight, 0)
            
            const Stretch = DrawInfo.JumpBallStretch
            this.Block.SetFloat("_Stretch", 1 + Stretch)
            this.Block.SetFloat("_Alpha", RotationSpeed)
            this.Block.SetFloat("_Spin", -RotationSpeed * 30)
            
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