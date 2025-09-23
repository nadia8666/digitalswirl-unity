import { AddLog } from "Code/shared/common/utility/logger"
import { Camera } from "./draw/camera"
import { Renderer } from "./draw/renderer"
import { StateMachine } from "./statemachine"
import * as Render from "Code/shared/common/utility/renderregistry"
import { Input } from "./control/input"
import { CharacterInfo } from "Code/shared/characterinfo"
import { UIMain } from "./ui"
import { Animation } from "./draw/animation"
import { ObjectController } from "./object/objectcontroller"
import { Rail, SetRail } from "./modules/rail"
import { SoundController } from "./draw/sound"
import { PlaneProject } from "Code/shared/common/utility/vutil"
import { FromToRotation } from "Code/shared/common/utility/cfutil"
import { Constants } from "Code/shared/common/constants"
import * as Routes from "Code/shared/common/replication/routes"

/**
 * Flags list
 * @class
 */
class Flags {
    public LastUp = Vector3.yAxis

    /**
     * Does not control the `JumpBall` or `Roll`, view {@link EnterBall} for more info
     */
    public BallEnabled = false
    public TrailEnabled = false

    // Damage
    public HurtTime = 0
    public Invulnerability = 0

    public Gravity = new Vector3(0, -1, 0)

    // Moves
    /**
     * Timer to reduce gravity while holding `Client.Input.Button.Jump` 
     */
    public JumpTimer = 0
    public SpindashSpeed = 0
    public Bounces = 0
    public InBounce = false
    public AirKickEnabled = false

    /**
     * Amount of updates joystick input should be locked for
     */
    public LockTimer = 0
    /**
     * Flag that cancels out gravity while `Client.LockTimer > 0`
     */
    public DirectVelocity = false
    public ForceKeepTime = 0
    public InWater = false // TODO: implement water
}

/**
 * Item/Collection state
 * @class
 * @ClientComponent
 */
class CollectState {
    public Shield: string = ""
    public Power: string = ""
    public Rings: number = 0
    public Score: number = 0

    public AddScore(Change: number) {
        this.Score += Change
    }

    public AddRings(Change: number) {
        this.Rings += Change
    }


}

/**
 * Ground interaction container
 * @class
 * @ClientComponent
 */
class Ground {
    public Grounded: boolean = false
    public Floor: BasePart | undefined
    public FloorLast: CFrame | undefined
    public FloorOffset: CFrame | undefined
    public FloorSpeed: Vector3 = Vector3.zero

    /**
     * Dot product between `Client.Angle.UpVector` and `Client.Flags.Gravity`
     */
    public DotProduct: number = -1
}

/**
 * Client
 * @class
 */
export class Client {
    // Main
    public readonly Character: Model
    public readonly Humanoid: Humanoid
    public Position: Vector3
    public Speed: Vector3
    public Angle: CFrame
    public LastCFrame: CFrame
    public CurrentCFrame: CFrame
    public RenderCFrame: CFrame
    public PreviousAngle: CFrame

    // Flags
    public Flags: Flags
    public CollectState: CollectState

    // Character info
    public readonly Physics
    public readonly Animations

    // Modules
    public readonly State: StateMachine
    public readonly Camera: Camera
    public readonly Animation: Animation
    public readonly Renderer: Renderer
    public readonly Input: Input
    public readonly UI: UIMain
    public readonly Object: ObjectController
    public readonly Rail: Rail
    public readonly Sound: SoundController

    // Components
    public Ground

    constructor(Character: Model) {
        this.Character = Character
        this.Humanoid = this.Character.WaitForChild("Humanoid") as Humanoid
        this.Position = Character.GetPivot().Position
        this.Angle = Character.GetPivot().Rotation
        this.Speed = Vector3.zero

        this.LastCFrame = this.Angle.add(this.Position)
        this.CurrentCFrame = this.LastCFrame
        this.RenderCFrame = this.CurrentCFrame

        this.Physics = CharacterInfo.Physics
        this.Animations = CharacterInfo.Animations

        this.State = new StateMachine(this)
        this.Animation = new Animation(this)
        this.Camera = new Camera(this)
        this.Renderer = new Renderer(this)
        this.Input = new Input(this)
        this.UI = new UIMain()
        this.Object = new ObjectController(this)
        this.Rail = new Rail()
        this.Sound = new SoundController()

        this.Ground = new Ground()

        this.Flags = new Flags()
        this.CollectState = new CollectState()

        Render.RegisterStepped("Client", Enum.RenderPriority.Input.Value + 1, (DeltaTime) => this.Update(DeltaTime))

        this.PreviousAngle = CFrame.identity

        AddLog(`Loaded new Client ${Character}`)
    }

    /**
     * Destroys the Client
     */
    public Destroy() {
        //TODO
        this.Sound.Destroy()
    }

    /**
     * Update Client once per frame, **do not run this method if you do not know what you're doing!**
     */
    public Update(DeltaTime: number) {
        // Angle reset
        if (this.PreviousAngle !== this.Angle) {
            this.SetGroundRelative()
            this.PreviousAngle = this.Angle
        }

        // Update state machine
        this.State.Update(DeltaTime)

        // Interpolate positions
        this.RenderCFrame = this.LastCFrame.Lerp(this.Angle.add(this.Position), this.State.TickTimer)

        this.Renderer.Draw(DeltaTime)
        this.Camera.Update(DeltaTime)

        this.Sound.Update(this.State.GetStateName(this.State.Current))
    }

    // Utility functions
    /**
     * Returns the Clients current CFrame
     * @returns {CFrame}
     */
    public GetCFrame() {
        return this.Angle.add(this.Position)
    }

    /**
     * Convert a vector into a local space vector centered on the Client's {0,0,0}
     * 
     * Mainly used for Client.Speed
     * @param Vector Vector to convert
     * @returns Local vector
     */
    public ToLocal(Vector: Vector3) {
        return (this.GetCFrame().mul(CFrame.Angles(0, math.rad(90), 0))).VectorToObjectSpace(Vector)
    }

    /**
     * Inverse of Client.ToLocal, converts a vector from Client local space to world space
     * 
     * Mainly used for Client.Speed
     * @param Vector Vector to convert
     * @returns Global vector
     */
    public ToGlobal(Vector: Vector3) {
        return (this.GetCFrame().mul(CFrame.Angles(0, math.rad(90), 0))).VectorToWorldSpace(Vector)
    }

    /**
     * Get the scripted center of the Client
     * @returns Client center position
     */
    public GetMiddle() {
        return this.Position.add(this.Angle.UpVector.mul(this.Physics.Height * this.Physics.Scale))
    }

    /**
     * !! THIS METHOD IS AUTOMATICALLY RAN ON Client.ANGLE CHANGE !!
     * 
     * 
     * Updates Client.Ground.DotProduct (Dot product of Client.Angle and Client.Flags.Gravity)
     */
    public SetGroundRelative() {
        this.Ground.DotProduct = this.Angle.UpVector.mul(-1).Dot(this.Flags.Gravity.Unit)
    }

    /**
     * Forces Client into ball
     * 
     * `JumpBall` will be automatically triggered if Animation is `Roll` `and Client.Flags.BallEnabled === true`
     */
    public EnterBall() {
        this.Flags.TrailEnabled = false
        this.Flags.BallEnabled = true
    }

    /**
     * Exits the Clients current ball, check {@link EnterBall} for `Roll`/`JumpBall` rules
     */
    public ExitBall() {
        this.Sound.Stop("Character/SpindashCharge")

        this.Flags.TrailEnabled = false
        this.Flags.BallEnabled = false
    }

    /**
     * Helper method to cleanup all air-specific actions, run this when landed
     */
    public Land() {
        this.ExitBall()
        this.Flags.Bounces = 0
        this.Flags.InBounce = false
    }

    /**
     * Undoes the value changes from objects 
     */
    public ResetObjectState() {
        this.Flags.DirectVelocity = false
        this.Flags.AirKickEnabled = false
        this.Flags.InBounce = false
        this.Flags.LockTimer = 0
        this.Rail.RailTrick = 0

        SetRail(this)
    }

    /**
     * Air resist when affected by water
     */
    public GetAirResist() {
        return this.Physics.AirResist.mul(new Vector3(1, this.Flags.InWater && 1.5 || 1, 1))
    }

    /**
     * Run acceleration when affected by water
     */
    public GetRunAcceleration() {
        return this.Physics.RunAcceleration * (this.Flags.InWater && .65 || 1)
    }

    /**
     * Weight when affected by water
     */
    public GetWeight() {
        return this.Physics.Weight * (this.Flags.InWater && .45 || 1)
    }

    /**
     * @returns DirectVelocity, Determines whether gravity is applied
     */
    public IsScripted() {
        return this.Flags.DirectVelocity && this.Flags.LockTimer > 0 && true || false
    }

    /**
     * Damages the player and knocks them back
     * @param Source Origin Position
     */
    public Damage(Source: Vector3) {
        // TODO: invincibility
        if (this.Flags.Invulnerability > 0) { return }

        // TODO
        // spilled ring

        this.ResetObjectState()
        this.ExitBall()
        this.Flags.HurtTime = math.floor(1.5 * Constants.Tickrate)
        this.Flags.Invulnerability = math.floor(2.75 * Constants.Tickrate)
        this.State.Current = this.State.States.Hurt

        const [AngleDiff] = PlaneProject(Source ? (Source.sub(this.GetMiddle())) : (this.Angle.LookVector), this.Flags.Gravity.Unit.mul(-1))

        if (AngleDiff.Magnitude !== 0) {
            const Factor = math.abs(this.ToGlobal(this.Speed).Dot(AngleDiff.Unit)) / 5
            this.Angle = FromToRotation(this.Angle.LookVector, AngleDiff.Unit)
            this.Speed = this.ToLocal(AngleDiff.Unit.mul(-1.125 * (1 - Factor)).add(this.Flags.Gravity.Unit.mul(-1.675 * (1 - Factor / 4))))
        } else {
            this.Speed = this.ToLocal(this.Flags.Gravity.Unit.mul(-2.125))
        }

        if (this.CollectState.Shield === "") {
            if (this.CollectState.Rings > 0) {
                //TODO: spilled rings
                this.CollectState.Rings = 0
            } else {
                //TODO: die
                this.State.Current = this.State.States.None
                Routes.RespawnRoute.send()
            }
        } else {
            this.CollectState.Shield = ""
        }

        return true
    }
}