import Client from "../Client"
import { Mouse } from "@Easy/Core/Shared/UserInput"
import { CFrame } from "Code/Shared/Types"
import { Airship } from "@Easy/Core/Shared/Airship"
import { Settings } from "Code/Shared/Settings"
import { Constants } from "Code/Shared/Components/ConfigSingleton"

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
        this.Rotation = { X: 0, Y: 0, Z: 0 }
        this.Zoom = 32
        this.Client = Client
        this.InputVector = Vector3.right

        this.InputChanged = Mouse.onScrolled.Connect((Delta) => {
            this.Zoom = math.clamp(this.Zoom - (Delta.delta * 4), 0, 64)
        })

        this.CameraOffset = Client.Config.CameraOffset
    }

    /**
     * Update `Camera`
     * @param Delta DeltaTime
     * @returns 
     */
    public Update(Delta: number) {
        let JoyRight = Vector2.zero
        const MouseDelta = Mouse.GetDelta()

        const Scale = this.Client.Config.Scale
        const Angle = this.Client.Renderer.Angle
        const RenderPos = this.Client.RenderCFrame.Position
        const RenderCFrame = new CFrame(RenderPos, Angle)

        const RotatingCamera =
            this.Client.Mouse.Locked ? true :
                Mouse.IsOverUI() ? false : (Mouse.isRightDown && MouseDelta.magnitude > 0)

        if (RotatingCamera) {
            let CamDelta = MouseDelta

            const Delta = CamDelta.mul(MouseSensitivity).mul(Airship.Input.GetMouseSensitivity() * 50 * Settings.CameraSensitivity)

            const PitchMod = -Delta.y
            const YawMod = Delta.x

            this.Rotation.X = math.clamp(this.Rotation.X + math.rad(PitchMod), math.rad(-PitchMax), math.rad(PitchMax))
            this.Rotation.Y += math.rad(YawMod)
        }

        const Rotation = Quaternion.Euler(0, math.deg(this.Rotation.Y), 0).mul(Quaternion.Euler(math.deg(this.Rotation.X), 0, 0))

        let FinalCFrame =
            new CFrame(RenderPos, Rotation).add(
                Angle.mul(this.CameraOffset.mul(Scale))
            ).mul(
                new CFrame(Vector3.forward.mul(-this.Zoom * Scale))
            )

        let Origin = RenderCFrame.mul(new CFrame(this.CameraOffset.mul(Scale))).Position
        // Origin cast
        {
            const Look = Origin.sub(RenderPos.add(Angle.mul(Vector3.up.mul(.25))))
            const [Hit, Position] = Physics.Raycast(RenderPos.add(Angle.mul(Vector3.up.mul(.25))), Look.normalized, Look.magnitude, Constants().Masks().CollisionLayer)

            if (Hit) {
                Origin = Position!.sub(Look.normalized.mul(.1))
            }
        }

        // Camera cast
        {
            const Look = FinalCFrame.Position.sub(Origin)
            const Velocity = Look.magnitude

            const [Hit, Position] = Physics.Raycast(Origin, Look.normalized, Velocity, )

            if (Hit) {
                FinalCFrame = new CFrame(Position!.sub(Look.normalized.mul(.1)), FinalCFrame.Rotation)
            }
        }

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