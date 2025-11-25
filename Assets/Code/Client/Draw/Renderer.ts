import Client from "../Client";
import { Asset } from "@Easy/Core/Shared/Asset";
import JumpBall from "./Components/JumpBall";
import SpindashBall from "./Components/SpindashBall";
import { DrawInformation } from "Code/Shared/Types";



/**
 * Client renderer
 * @class
 */
export class Renderer {
    public Angle: Quaternion = Quaternion.identity
    public CharacterVisible: boolean = false
    public JumpBall: JumpBall
    public SpindashBall: SpindashBall
    public Parts: GameObject[] = []
    public transform: Transform

    constructor(RootTransform: Transform, RigParent: GameObject) {
        this.transform = RootTransform

        const JumpBallPrefab = Instantiate(Asset.LoadAsset("Assets/Resources/Prefabs/JumpBall.prefab"))
        JumpBallPrefab.transform.SetParent(RootTransform)

        this.JumpBall = JumpBallPrefab.GetAirshipComponent<JumpBall>()!

        const SpindashBallPrefab = Instantiate(Asset.LoadAsset("Assets/Resources/Prefabs/SpindashBall.prefab"))
        SpindashBallPrefab.transform.SetParent(RootTransform)

        this.SpindashBall = SpindashBallPrefab.GetAirshipComponent<SpindashBall>()!
        
        for (const [_, Object] of pairs(RigParent.GetComponentsInChildren<Transform>(true)))
            this.Parts.push(Object.gameObject)
    }

    /**
     * Draw Client, should only execute at the end of each `RenderStepped`
     */
    public Draw(DeltaTime: number, DrawInfo: DrawInformation) {
        const Offset = DrawInfo.RailOffset
        let Angle = DrawInfo.Rotation.mul(Quaternion.Euler(0, 0, -math.deg(DrawInfo.RailBalance)))
        this.Angle = Quaternion.Slerp(Angle, this.Angle, (.675 ** 60) ** DeltaTime)

        let Position = DrawInfo.Position
        Position = Position.add(Offset)

        this.transform.position = Position
        this.transform.rotation = this.Angle

        this.JumpBall.SetEnabled(DrawInfo.JumpBall)
        this.JumpBall.Draw(DeltaTime, DrawInfo)

        this.SpindashBall.SetEnabled(DrawInfo.SpindashBall, DrawInfo)
        this.SpindashBall.Draw(DeltaTime, DrawInfo)

        const CharacterVisible = !this.JumpBall.Enabled && !this.SpindashBall.Enabled
        this.SetVisible(CharacterVisible)
    }

    public Destroy() {}

    public SetVisible(Visible: boolean) {
        if (this.CharacterVisible === Visible) return
        this.CharacterVisible = Visible

        for (const [_, Mesh] of pairs(this.Parts)) 
            Mesh.SetActive(Visible)
    }
}