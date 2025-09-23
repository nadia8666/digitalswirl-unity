import { deepCopy as DeepCopy } from "Code/@rbxts/deepcopy";
import { Client } from "..";
import { InferredAnimation, SetAnimation, ValidAnimation } from "Code/shared/characterinfo";

/**
 * @class
 */
export class Animation {
    public Animations
    public Current: ValidAnimation
    public Speed: number = 0
    private Last: ValidAnimation

    constructor(Client: Client) {
        this.Animations = DeepCopy(Client.Animations) as unknown as { [Index in keyof typeof Client.Animations]: SetAnimation }
        this.Last = "Idle"
        this.Current = "Fall"

        this.LoadAnimations(Client)
    }

    /**
     * Load all animations from `Client.Animations` and load events
     * @param Client
     */
    public LoadAnimations(Client: Client) {
        const AnimationController: Animator = (Client.Character.WaitForChild("Humanoid").WaitForChild("Animator") as Animator) // TODO: make animationcontroller.animator
        for (const [_, AnimationInfo] of pairs(this.Animations)) {
            for (const [Key, Value] of pairs(AnimationInfo)) {
                let Animation = Value as InferredAnimation[0]

                if (typeIs(Key, "number")) {
                    const NewInstance = new Instance("Animation", AnimationController)
                    NewInstance.AnimationId = `rbxassetid://${Animation.AnimationID}`

                    Animation.Asset = AnimationController.LoadAnimation(NewInstance)
                    Animation.Asset.Looped = Animation.Looped
                }
            }
        }
    }

    /**
     * Will error out the framework if you do not load animations immediately! Beware of using this function without proper precautions
     */
    public UnloadAnimations() {
        for (const [_, AnimationInfo] of pairs(this.Animations)) {
            for (const [Key, Value] of pairs(AnimationInfo)) {
                let Animation = Value as InferredAnimation[0]

                if (typeIs(Key, "number")) {
                    Animation.Asset.Animation?.Destroy()
                    Animation.Asset.Destroy()
                    Animation.Asset = undefined as unknown as AnimationTrack
                }
            }
        }
    }

    /**
     * Do not run
     * @param Animation
     * @param Playing
     */
    private UpdateState(Animation: InferredAnimation, Playing: boolean, TransitionTime?: number) {
        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }
            Value.Asset[Playing ? "Play" : "Stop"](TransitionTime)
        }
    }

    private GetCurrentTrack(Client: Client, Animation: InferredAnimation) {
        let Track

        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                let Triggered = false

                const Next = Animation[Key + 1]
                if (Next && Next.Position) {
                    Triggered = Client.Speed.X >= Value.Position && Client.Speed.X < Next.Position
                } else {
                    Triggered = Client.Speed.X >= Value.Position
                }

                if (Triggered) {
                    Track = Value.Asset
                    break
                }
            }
        }

        if (!Track) {
            Track = Animation[0].Asset
        }

        return Track
    }

    private UpdateSpeed(Value: InferredAnimation[0]) {
        if (!Value.Speed) { return }

        let Speed = Value.Speed.Base + (Value.Speed.Increment * this.Speed)
        if (Value.Speed.Absolute) {
            Speed = math.abs(Speed)
        }

        Value.Asset.AdjustSpeed(Speed)
    }

    /**
     * Do not run
     * @param Client
     * @param Animation 
     */
    private UpdateCurrent(Client: Client, Animation: InferredAnimation) {
        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                Value.Asset.AdjustWeight(this.GetCurrentTrack(Client, Animation) === Value.Asset ? 1 : .01)
            }

            this.UpdateSpeed(Value)
        }
    }

    /**
     * Change current Clients animation and update
     * @param Client 
     */
    public Animate(Client: Client) {
        const Previous = (this.Animations[this.Last])
        const Next = (this.Animations[this.Current])

        if (Previous === Next && Next.EndAnimation) {
            const Track = this.GetCurrentTrack(Client, Next)
            if (!Track.IsPlaying || Track.TimePosition >= Track.Length) {
                Track.Play(0, undefined, 1)
                Track.TimePosition = Track.Length - .001

                this.Current = Next.EndAnimation
            }
        }

        if (Previous !== Next) {
            this.Speed = 1

            let [TransitionTo, TransitionFrom]: [number | undefined, number | undefined] = [undefined, undefined]

            if (Previous.Transitions) {
                if (Previous.Transitions.All) {
                    const Transition = Previous.Transitions.All

                    TransitionTo = Transition.To
                    TransitionFrom = Transition.From
                }

                for (const [Target, Transition] of pairs(Previous.Transitions)) {
                    if (Target === "All") { continue }

                    if (this.Current === Target && Transition.From !== undefined) {
                        TransitionFrom = Transition.From
                    }
                }
            }

            if (Next.Transitions) {
                if (Next.Transitions.All) {
                    const Transition = Next.Transitions.All

                    TransitionTo = Transition.To
                    TransitionFrom = Transition.From
                }

                for (const [Target, Transition] of pairs(Next.Transitions)) {
                    if (Target === "All") { continue }

                    if (this.Last === Target && Transition.From !== undefined) {
                        TransitionTo = Transition.From
                    }
                }
            }

            this.UpdateState(Previous, false, TransitionFrom)
            this.UpdateState(Next, true, TransitionTo)

            this.Last = this.Current
        }

        this.UpdateCurrent(Client, Next)
    }

    public GetRate(Client: Client) {
        const Track = this.GetCurrentTrack(Client, this.Animations[this.Current])

        return Track && Track.Length > 0 ? Track.Speed / Track.Length : 0
    }
}