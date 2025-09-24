import { CFrame } from "Code/Shared/Types";
import Client from "../Client";

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

    constructor(Client: Client) {
        this.Client = Client
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
    }

    public SetVisible(Visible: boolean) {
        if (this.CharacterVisible === Visible) { return }
        this.CharacterVisible = Visible
    }
}