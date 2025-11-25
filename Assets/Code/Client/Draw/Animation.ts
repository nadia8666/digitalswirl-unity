import { Animations, InferredAnimation, SetAnimation, ValidAnimation } from "Code/Shared/Animations";
import { DrawInformation } from "Code/Shared/Types";
import { Constants } from "Code/Shared/Components/ConfigSingleton";

class Tilt {
    public CurrentTilt: number = 0
    public RotationFunction
    public transform
    public LerpForce
    public ClearRotation

    constructor(RigParent: Transform, Path: string[], ClearRotation: boolean, LerpForce: number, RotationFunction: (Tilt: number) => Quaternion) {
        this.RotationFunction = RotationFunction

        let CurrentTransform = RigParent
        for (const [_, Value] of pairs(Path)) {
            CurrentTransform = CurrentTransform.FindChild(Value)

            if (!CurrentTransform) error(`Failed to find transform on path ${Value}`)
        }

        this.transform = CurrentTransform
        this.LerpForce = LerpForce
        this.ClearRotation = ClearRotation
    }

    public Update(DeltaTime: number, NewTilt: number) {
        this.CurrentTilt = math.lerp(this.CurrentTilt, NewTilt, DeltaTime * this.LerpForce)

        const Target = this.RotationFunction(this.CurrentTilt)
        this.transform.localRotation = this.ClearRotation ? Target : this.transform.localRotation.mul(Target)
    }
}

function Evaluate(Curve: AnimationCurve, Tilt: number) {
    return Curve.Evaluate(math.abs(Tilt) / 80) * math.sign(Tilt) * 80
}

/**
 * @class
 */
export class Animation {
    public Current: ValidAnimation
    public Speed: number = 1
    private ClientSpeed: Vector3 = Vector3.zero
    private Last: ValidAnimation
    private Tilts: Tilt[] = []
    public Turn: number = 0
    public WeightLayers = {
        [0]: { Target: 1, Current: 1 },
        [1]: { Target: 1, Current: 0 },
        [2]: { Target: 1, Current: 0 },
    }

    constructor(EventListener: AnimationEventListener, RigParent: Transform, public AnimList: typeof Animations, private Controller: Animator, public DrawInfo: DrawInformation) {
        this.Last = "Idle"
        this.Current = "Fall"

        EventListener.OnAnimEvent((Key) => {
            if (Key === "EndAnimation") {
                const Animation = AnimList[this.Current] as SetAnimation

                if (Animation.EndAnimation) {
                    this.Current = Animation.EndAnimation
                }
            }
        })

        const Tilts = Constants()

        this.Tilts.push(new Tilt(RigParent, ["RigAnimation"], true, 5, function (Tilt) { return Quaternion.Euler(-90, 0, 0).mul(Quaternion.Euler(0, Evaluate(Tilts.RigAnimationTilt, -Tilt) / 3, 0)) }))
        this.Tilts.push(new Tilt(RigParent, ["RigAnimation", "ref", "root", "root_pivot", "torso", "lower_torso", "chest", "upper_torso", "neck"], false, 5,
            function (Tilt) {
                return Quaternion.Euler(0, Evaluate(Tilts.HeadTilt, Tilt), 0)
            }))
        this.Tilts.push(new Tilt(RigParent, ["RigAnimation", "ref", "root", "root_pivot", "torso", "lower_torso", "chest", "upper_torso", "neck", "head", "eye_root", "eye.l"], false, 7,
            function (Tilt) { return Quaternion.Euler(0, 0, math.clamp(Evaluate(Tilts.EyeTilt, Tilt) / 2, -40, 0)) }))
        this.Tilts.push(new Tilt(RigParent, ["RigAnimation", "ref", "root", "root_pivot", "torso", "lower_torso", "chest", "upper_torso", "neck", "head", "eye_root", "eye.r"], false, 7,
            function (Tilt) { return Quaternion.Euler(0, 0, math.clamp(Evaluate(Tilts.EyeTilt, Tilt) / 2, 0, 40)) }))
    }

    /**
     * Do not run
     * @param Animation
     * @param Playing
     */
    private UpdateState(Animation: InferredAnimation, Playing: boolean, TransitionTime?: number) {
        if (Playing) {
            for (let i of $range(0, this.Controller.layerCount - 1)) {
                this.WeightLayers[i as 0].Target = 0
            }

            for (const [Key, Value] of pairs(Animation)) {
                if (typeOf(Key) !== "number") { continue }

                this.Controller.CrossFadeInFixedTime(Value.Name, TransitionTime ?? .2, Key)
                this.WeightLayers[Key as 0].Target = 1
            }
        }
    }

    private GetCurrentTrack(Animation: InferredAnimation) {
        let [Track, Layer] = [Animation[0].Name, 0]

        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                let Triggered = false

                const Next = Animation[Key + 1]
                if (Next && Next.Position) {
                    Triggered = this.ClientSpeed.x >= Value.Position && this.ClientSpeed.x < Next.Position
                } else {
                    Triggered = this.ClientSpeed.x >= Value.Position
                }

                if (Triggered) {
                    Track = Value.Name
                    Layer = Key
                    break
                }
            }
        }

        return $tuple(Track, Layer)
    }

    private UpdateSpeed(Value: InferredAnimation[0]) {
        let Speed

        if (Value.Speed) {
            Speed = Value.Speed.Base + (Value.Speed.Increment * this.Speed)
            if (Value.Speed.Absolute) {
                Speed = math.abs(Speed)
            }
        } else {
            Speed = this.Speed
        }

        this.Controller.SetFloat("AnimSpeed", Speed)
    }

    private CalculateWeightAndSpeed(Animation: InferredAnimation, Initial: boolean = false) {
        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                this.WeightLayers[Key as 0].Target = this.GetCurrentTrack(Animation)[0] === Value.Name ? 1 : .01

                if (Initial)
                    this.WeightLayers[Key as 0].Current = this.WeightLayers[Key as 0].Target
            }

            this.UpdateSpeed(Value)
        }
    }


    /**
     * Do not run
     * @param Client
     * @param Animation 
     */
    private UpdateCurrent(Animation: InferredAnimation, Delta: number) {
        this.CalculateWeightAndSpeed(Animation)

        for (let i of $range(0, this.Controller.layerCount - 1)) {
            const Layer = this.WeightLayers[i as 0]
            Layer.Current = math.lerpClamped(Layer.Current, Layer.Target, 8 * Delta)

            this.Controller.SetLayerWeight(i, Layer.Current)
        }
    }

    public GetTransitions(Previous: SetAnimation, Animation: SetAnimation) {
        let [LastFrom, LastTo]: [number?, number?] = [undefined, undefined]
        let [NextFrom, NextTo]: [number?, number?] = [undefined, undefined]

        /* 
            Order of priorities
            LastFrom -> New
            LastTo -> New
            NewFrom -> New
            NewTo -> New - triggers lastto -> new instead
        */

        if (Previous.Transitions) {
            if (Previous.Transitions.From) {
                LastFrom = Previous.Transitions.From.All
            }

            if (Previous.Transitions.To) {
                LastTo = Previous.Transitions.To.All ?? Previous.Transitions.To[this.Current]
            }
        }

        if (Animation.Transitions) {
            if (Animation.Transitions.From) {
                NextFrom = Animation.Transitions.From.All ?? Animation.Transitions.From[this.Last]
            }
        }

        let TargetTime = NextFrom ?? LastTo ?? LastFrom

        return TargetTime
    }

    /**
     * Change current Clients animation and update
     * @param Client 
     */
    public Animate(DeltaTime: number) {
        this.ClientSpeed = this.DrawInfo.Speed ?? Vector3.zero

        const Previous = (this.AnimList[this.Last]) as SetAnimation
        const Next = (this.AnimList[this.Current]) as SetAnimation

        if (Previous !== Next) {
            this.Speed = 1

            const TargetTime = this.GetTransitions(Previous, Next)

            this.UpdateState(Next, true, TargetTime)
            this.CalculateWeightAndSpeed(Next, true)

            this.Last = this.Current
        }

        this.UpdateCurrent(Next, DeltaTime)
    }

    public GetRate() {
        const [_, Layer] = this.GetCurrentTrack(this.AnimList[this.Current])
        const Clip = this.Controller.GetCurrentAnimatorStateInfo(Layer)

        return (Clip.speed * Clip.speedMultiplier) / Clip.length
    }

    public DynamicTilt(DeltaTime: number) {
        const NewTilt = this.Turn >= math.rad(135) ? 0 : math.clamp(this.Turn, math.rad(-80), math.rad(80))

        for (const [_, Tilt] of pairs(this.Tilts)) {
            Tilt.Update(DeltaTime, math.deg(NewTilt))
        }
    }
}