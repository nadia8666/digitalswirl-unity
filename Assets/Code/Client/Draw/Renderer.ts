import { CFrame } from "Code/Shared/Types";
import Client from "../Client";
import { Asset } from "@Easy/Core/Shared/Asset";
import JumpBall from "./Components/JumpBall";

const pi = math.pi
const tau = pi * 2

/**
 * Client renderer
 * @class
 */
export class Renderer {
    private Client: Client
    public Angle: Quaternion = Quaternion.identity
    public CharacterVisible: boolean = false
    public JumpBall: JumpBall
    public Parts: GameObject[] = []

    constructor(Client: Client) {
        this.Client = Client

        const JumpBallPrefab = Instantiate(Asset.LoadAsset("Assets/Resources/Prefabs/JumpBall.prefab"))
        JumpBallPrefab.transform.SetParent(Client.transform)

        this.JumpBall = JumpBallPrefab.GetAirshipComponent<JumpBall>()!
        
        for (const [_, Object] of pairs(this.Client.RigParent.GetComponentsInChildren<Transform>(true)))
            this.Parts.push(Object.gameObject)
    }

    /**
     * Draw Client, should only execute at the end of each `RenderStepped`
     */
    public Draw(DeltaTime: number) {
        const Offset = this.Client.Rail.RailOffset
        let Angle = this.Client.RenderCFrame.Rotation.mul(Quaternion.Euler(0, 0, -math.deg(this.Client.Rail.RailBalance)))
        this.Angle = Quaternion.Slerp(Angle, this.Angle, (.675 ** 60) ** DeltaTime)

        let Position = this.Client.RenderCFrame.Position
        Position = Position.add(Offset)

        this.Client.transform.position = Position
        this.Client.transform.rotation = this.Angle

        this.JumpBall.SetEnabled(this.Client.Flags.BallEnabled && this.Client.Animation.Current === "Roll")

        this.JumpBall.Draw(this.Client, DeltaTime)

        const CharacterVisible = !this.JumpBall.Enabled
        this.SetVisible(CharacterVisible)
    }

    public Destroy() {
        this.JumpBall.Destroy()
    }

    public SetVisible(Visible: boolean) {
        if (this.CharacterVisible === Visible) return
        this.CharacterVisible = Visible

        for (const [_, Mesh] of pairs(this.Parts)) 
            Mesh.SetActive(Visible)
    }
}