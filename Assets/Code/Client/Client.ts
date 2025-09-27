import { Camera } from "./Draw/Camera"
import { Renderer } from "./Draw/Renderer"
import { StateMachine } from "./StateMachine"
import { Input } from "./Control/Input"
import { CharacterInfo } from "Code/Shared/CharacterInfo"
import { Animation } from "./Draw/Animation"
import { ObjectController } from "./Object/ObjectController"
import { Rail, SetRail } from "./Modules/Rail"
import { SoundController } from "./Draw/Sound"
import { PlaneProject } from "Code/Shared/Common/Utility/VUtil"
import { Constants } from "Code/Shared/Common/Constants"
import { CFrame } from "Code/Shared/Types"
import { Mouse } from "@Easy/Core/Shared/UserInput"
import { Bin } from "@Easy/Core/Shared/Util/Bin"

/**
 * Flags list
 * @class
 */
class Flags {
    public LastUp = Vector3.up

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
    public Floor: Transform | undefined
    public FloorLast: CFrame | undefined
    public FloorSpeed: Vector3 = Vector3.zero
    public FloorOffset: CFrame

    /**
     * Dot product between `Client.Angle.UpVector` and `Client.Flags.Gravity`
     */
    public DotProduct: number = -1
}

/**
 * Client
 * @class
 */
export default class Client extends AirshipBehaviour {
    // Main
    public Controller: Animator

    public Position: Vector3
    public Speed: Vector3
    public Angle: Quaternion
    public LastCFrame: CFrame
    public CurrentCFrame: CFrame
    public RenderCFrame: CFrame
    public PreviousAngle: Quaternion

    // Flags
    public Flags: Flags
    public CollectState: CollectState

    // Character info
    public Physics: typeof CharacterInfo.Physics
    public Animations: typeof CharacterInfo.Animations

    // Modules
    public State: StateMachine
    public Camera: Camera
    public Animation: Animation
    public Renderer: Renderer
    public Input: Input
    public Object: ObjectController
    public Rail: Rail
    public Sound: SoundController

    // Components
    public Ground: Ground
    public Mouse = {
        Locked: true,
        Bin: new Bin(),
    }
    public EventListener: AnimationEventListener

    override Start() {
        this.Position = this.transform.position
        this.Angle = this.transform.rotation
        this.Speed = Vector3.zero

        this.CurrentCFrame = CFrame.FromTransform(this.transform)
        this.LastCFrame = this.CurrentCFrame
        this.RenderCFrame = this.CurrentCFrame

        this.Physics = CharacterInfo.Physics
        this.Animations = CharacterInfo.Animations

        this.State = new StateMachine(this)
        this.Animation = new Animation(this)
        this.Camera = new Camera(this)
        this.Renderer = new Renderer(this)
        this.Input = new Input(this)
        this.Object = new ObjectController(this)
        this.Rail = new Rail()
        this.Sound = new SoundController()

        this.Ground = new Ground()

        this.Flags = new Flags()
        this.CollectState = new CollectState()

        this.PreviousAngle = Quaternion.identity
    }

    override OnDestroy() {
        this.Mouse.Bin.Clean()
    }

    /**
     * Destroys the Client
     */
    public Destroy() {
        //TODO
        this.Sound.Destroy()
    }

    public Update(DeltaTime: number) {
        // Angle reset
        if (this.PreviousAngle !== this.Angle) {
            this.SetGroundRelative()
            this.PreviousAngle = this.Angle
        }

        // Update state machine
        this.State.Update(DeltaTime)

        // Interpolate positions
        this.RenderCFrame = this.LastCFrame.Lerp(new CFrame(this.Position, this.Angle), this.State.TickTimer)

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
        return new CFrame(this.Position, this.Angle)
    }

    /**
     * Convert a vector into a local space vector centered on the Client's {0,0,0}
     * 
     * Mainly used for Client.Speed
     * @param Vector Vector to convert
     * @returns Local vector
     */
    public ToLocal(Vector: Vector3) {
        const MathAngle = this.Angle.mul(Quaternion.Euler(0, -90, 0))

        // may need to swap
        return Quaternion.Inverse(MathAngle).mul(Vector).mul(new Vector3(1, 1, -1))
    }

    /**
     * Inverse of Client.ToLocal, converts a vector from Client local space to world space
     * 
     * Mainly used for Client.Speed
     * @param Vector Vector to convert
     * @returns Global vector
     */
    public ToGlobal(Vector: Vector3) {
        const MathAngle = this.Angle.mul(Quaternion.Euler(0, -90, 0))

        // may need to swap
        return MathAngle.mul(Vector).mul(new Vector3(1, 1, 1))
    }

    /**
     * Get the scripted center of the Client
     * @returns Client center position
     */
    public GetMiddle() {
        return this.Position.add(this.Angle.mul(Vector3.up).mul(this.Physics.Height * this.Physics.Scale))
    }

    /**
     * !! THIS METHOD IS AUTOMATICALLY RAN ON Client.ANGLE CHANGE !!
     * 
     * 
     * Updates Client.Ground.DotProduct (Dot product of Client.Angle and Client.Flags.Gravity)
     */
    public SetGroundRelative() {
        this.Ground.DotProduct = this.Angle.mul(Vector3.up).mul(-1).Dot(this.Flags.Gravity.normalized)
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

        const [AngleDiff] = PlaneProject(Source ? (Source.sub(this.GetMiddle())) : (this.Angle.mul(Vector3.forward)), this.Flags.Gravity.normalized.mul(-1))

        if (AngleDiff.magnitude !== 0) {
            const Factor = math.abs(this.ToGlobal(this.Speed).Dot(AngleDiff.normalized)) / 5
            this.Angle = Quaternion.FromToRotation(this.Angle.mul(Vector3.forward), AngleDiff.normalized)
            this.Speed = this.ToLocal(AngleDiff.normalized.mul(-1.125 * (1 - Factor)).add(this.Flags.Gravity.normalized.mul(-1.675 * (1 - Factor / 4))))
        } else {
            this.Speed = this.ToLocal(this.Flags.Gravity.normalized.mul(-2.125))
        }

        if (this.CollectState.Shield === "") {
            if (this.CollectState.Rings > 0) {
                //TODO: spilled rings
                this.CollectState.Rings = 0
            } else {
                //TODO: die
                this.State.Current = this.State.States.None
            }
        } else {
            this.CollectState.Shield = ""
        }

        return true
    }
}