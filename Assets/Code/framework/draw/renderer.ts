import { ReplicatedStorage, Workspace } from "Code/@rbxts/services";
import { Client } from "..";
import { FromToRotation } from "Code/shared/common/utility/cfutil";

const pi = math.pi
const tau = pi * 2

type AssetsDir = Folder & {
    JumpBall: Model
    BallTrail: Model
    SpindashBall: Model
}

class JumpBall {
    public Spin: number = 0
    public Model: Model
    public Smear: BasePart
    public Visible = true

    constructor(Renderer: Renderer) {
        this.Model = Renderer.Assets.JumpBall.Clone()
        this.Model.Parent = Workspace.CurrentCamera

        this.Smear = this.Model.WaitForChild("Smear") as BasePart

        this.SetVisible(false)
    }

    public GetSpin() {
        return CFrame.Angles(-this.Spin, 0, 0)
    }

    public Update(Pivot: CFrame, DeltaTime: number, Speed: number) {
        this.Spin = (this.Spin + (DeltaTime * Speed)) % tau

        this.Model.PivotTo(Pivot.mul(this.GetSpin()))
        this.Smear.LocalTransparencyModifier = 1 - math.clamp((math.abs(Speed) - 20) / 50, 0, 1)
    }

    public SetVisible(Visible: boolean, CFrame?: CFrame) {
        if (this.Visible !== Visible) {
            this.Visible = Visible

            if (this.Visible && CFrame) {
                this.Model.PivotTo(CFrame.mul(this.GetSpin()))
            }

            for (const [_, Instance] of pairs(this.Model.GetDescendants())) {
                if (Instance.IsA("BasePart")) {
                    Instance.LocalTransparencyModifier = this.Visible ? 0 : 1
                }
            }
        }
    }
}

class SpindashBall {

}

class BallTrail {
    public Model: Model
    public Visible = true

    constructor(Renderer: Renderer) {
        this.Model = Renderer.Assets.BallTrail.Clone()
        this.Model.Parent = Workspace.CurrentCamera

        this.SetVisible(false)
    }

    public Update(Position: Vector3) {
        if (this.Visible) {
            const Pivot = this.Model.GetPivot()
            const PreviousPos = Pivot.Position

            if (Position !== PreviousPos) {
                const Look = Pivot.LookVector
                let Diff = Position.sub(PreviousPos).Unit
                if (Look.Dot(Diff) < 0) {
                    Diff = Diff.mul(-1)
                }

                const RotationDiff = FromToRotation(Look, Diff).mul(Pivot.Rotation)
                this.Model.PivotTo(RotationDiff.add(Position))
            }
        }
    }

    public SetVisible(Visible: boolean, CFrame?: CFrame) {
        if (this.Visible !== Visible) {
            this.Visible = Visible

            if (this.Visible && CFrame) {
                this.Model.PivotTo(CFrame)
            }

            for (const [_, Instance] of pairs(this.Model.GetDescendants())) {
                if (Instance.IsA("Trail")) {
                    Instance.Enabled = this.Visible
                }
            }
        }
    }
}

/**
 * Client renderer
 * @class
 */
export class Renderer {
    private Client: Client
    public Angle: CFrame = CFrame.identity
    public Assets: AssetsDir
    public BallTrail
    public JumpBall
    public CharacterVisible: boolean = false

    constructor(Client: Client) {
        this.Client = Client

        this.Assets = ReplicatedStorage.WaitForChild("Assets").WaitForChild("Models").WaitForChild("Player") as AssetsDir

        this.BallTrail = new BallTrail(this)
        this.JumpBall = new JumpBall(this)
    }

    /**
     * Draw Client, should only execute at the end of each `RenderStepped`
     */
    public Draw(DeltaTime: number) {
        const Root = this.Client.Character.PrimaryPart
        if (!Root || !Root.IsA("BasePart")) { return }

        const Offset = this.Client.Rail.RailOffset
        let Angle = this.Client.RenderCFrame.Rotation.mul(CFrame.Angles(0, 0, -this.Client.Rail.RailBalance))

        let Position = this.Client.RenderCFrame.Position
        Position = Position.add(Offset)
        Position = Position.add(Angle.UpVector.mul((Root.Size.Y / 2) + (this.Client.Humanoid.HipHeight || 0)))

        this.Angle = Angle.Lerp(this.Angle, (.675 ** 60) ** DeltaTime)

        const Pivot = this.Angle.add(Position)
        this.Client.Character.PivotTo(Pivot)

        this.BallTrail.SetVisible(this.Client.Flags.TrailEnabled, Pivot)
        if (this.BallTrail.Visible) {
            this.BallTrail.Update(Position)
        }

        this.JumpBall.SetVisible(this.Client.Flags.BallEnabled && this.Client.Animation.Current === "Roll", Pivot)
        if (this.JumpBall.Visible) {
            this.JumpBall.Update(Pivot, DeltaTime, this.Client.Animation.GetRate(this.Client) * tau)
        }

        this.SetVisible(!this.JumpBall.Visible)
    }

    public SetVisible(Visible: boolean) {
        if (this.CharacterVisible === Visible) { return }
        this.CharacterVisible = Visible

        for (const [_, Instance] of pairs(this.Client.Character.GetDescendants())) {
            if (Instance.IsA("BasePart") || Instance.IsA("Decal")) {
                Instance.LocalTransparencyModifier = Visible ? 0 : 1
            }
        }
    }
}