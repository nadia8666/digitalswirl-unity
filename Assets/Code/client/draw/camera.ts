import { Signal } from "@Easy/Core/Shared/Util/Signal"
import Client from "../Client"
import { Mouse } from "@Easy/Core/Shared/UserInput"
import { CFrame } from "Code/Shared/Types"

const MouseSensitivity = new Vector2(1, 0.77).mul(math.rad(0.5))
const PitchMax = 85

/**
 * @class
 */
export class Camera {
    private Client: Client
    public InputChanged: () => void
    public Zoom: number
    public Rotation: { X: number, Y: number, Z: number }
    public InputVector: Vector3
    public CameraOffset: Vector3
    public Transform: Transform = GameObject.FindGameObjectWithTag("MainCamera").transform

    constructor(Client: Client) {
        //Render.RegisterStepped("Camera", Enum.RenderPriority.Camera.Value + 1, (Delta:number) => this.Update(Delta))
        this.Rotation = { X: 0, Y: 0, Z: 0 }
        this.Zoom = 16
        this.Client = Client
        this.InputVector = Vector3.right

        this.InputChanged = Mouse.onScrolled.Connect((Delta) => {
            this.Zoom = math.clamp(this.Zoom - (Delta.delta * 4), 0, 32)
        })

        this.CameraOffset = Client.Physics.CameraOffset
    }

    /**
     * Update `Camera`
     * @param Delta DeltaTime
     * @returns 
     */
    public Update(Delta: number) {
        let JoyRight = Vector2.zero
        const MouseDelta = Mouse.GetDelta()

        const RotatingCamera =
            (Mouse.isRightDown && MouseDelta.magnitude > 0)

        if (RotatingCamera) {
            let CamDelta = MouseDelta

            const Delta = CamDelta.mul(MouseSensitivity).mul(50)

            const PitchMod = -Delta.y
            const YawMod = Delta.x

            this.Rotation.X = math.clamp(this.Rotation.X + math.rad(PitchMod), math.rad(-PitchMax), math.rad(PitchMax))
            this.Rotation.Y += math.rad(YawMod)
        }

        const Rotation = Quaternion.Euler(0, math.deg(this.Rotation.Y), 0).mul(Quaternion.Euler(math.deg(this.Rotation.X), 0, 0))

        // TODO: abstract & implement popper
        const FinalCFrame =
            new CFrame(this.Client.RenderCFrame.Position, Rotation).mul(
                new CFrame(this.CameraOffset)
            ).add(
                new Vector3(0, this.Client.Physics.HipHeight, 0)
            ).add(
                Rotation.mul(Vector3.forward).mul(-this.Zoom)
            )

        this.Transform.rotation = Rotation
        this.Transform.position = FinalCFrame.Position

        this.InputVector = FinalCFrame.Rotation.mul(Vector3.forward)
    }

    /**
     * Destroy `Camera`
     */
    public Destroy() {
        this.InputChanged()
    }
}