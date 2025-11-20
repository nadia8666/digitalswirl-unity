import { Network } from "Code/Shared/Network";
import Client from "../Client";
import { InferredAnimation, SetAnimation, ValidAnimation } from "Code/Shared/CharacterInfo";

/**
 * @class
 */
export class Animation {
    public Current: ValidAnimation
    public Speed: number = 1
    private LastSpeed: number = 1
    private Last: ValidAnimation
    private Client: Client
    public WeightLayers = {
        [0]: { Target: 1, Current: 1 },
        [1]: { Target: 1, Current: 0 },
        [2]: { Target: 1, Current: 0 },
    }

    constructor(Client: Client) {
        this.Last = "Idle"
        this.Current = "Fall"
        this.Client = Client

        this.Client.EventListener.OnAnimEvent((Key) => {
            if (Key === "EndAnimation") {
                const Animation = Client.Animations[this.Current] as SetAnimation

                if (Animation.EndAnimation) {
                    this.Current = Animation.EndAnimation
                }
            }
        })
    }

    /**
     * Do not run
     * @param Animation
     * @param Playing
     */
    private UpdateState(Animation: InferredAnimation, Playing: boolean, TransitionTime?: number) {
        if (Playing) {
            for (let i of $range(0, this.Client.Controller.layerCount - 1)) {
                this.WeightLayers[i as 0].Target = 0
            }

            for (const [Key, Value] of pairs(Animation)) {
                if (typeOf(Key) !== "number") { continue }

                this.Client.Controller.CrossFadeInFixedTime(Value.Name, TransitionTime ?? .2, Key)
                this.WeightLayers[Key as 0].Target = 1
            }
        }
    }

    private GetCurrentTrack(Animation: InferredAnimation) {
        let Track

        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                let Triggered = false

                const Next = Animation[Key + 1]
                if (Next && Next.Position) {
                    Triggered = this.Client.Speed.x >= Value.Position && this.Client.Speed.x < Next.Position
                } else {
                    Triggered = this.Client.Speed.x >= Value.Position
                }

                if (Triggered) {
                    Track = Value.Name
                    break
                }
            }
        }

        if (!Track) {
            Track = Animation[0].Name
        }

        return Track
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

        this.Client.Controller.SetFloat("AnimSpeed", Speed)
    }

    private CalculateWeightAndSpeed(Animation: InferredAnimation, Initial: boolean = false) {
        for (const [Key, Value] of pairs(Animation)) {
            if (typeOf(Key) !== "number") { continue }

            if (Value.Position !== undefined) {
                this.WeightLayers[Key as 0].Target = this.GetCurrentTrack(Animation) === Value.Name ? 1 : .01

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

        for (let i of $range(0, this.Client.Controller.layerCount - 1)) {
            const Layer = this.WeightLayers[i as 0]
            Layer.Current = math.lerpClamped(Layer.Current, Layer.Target, 8 * Delta)

            this.Client.Controller.SetLayerWeight(i, Layer.Current)
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
        const Previous = (this.Client.Animations[this.Last]) as SetAnimation
        const Next = (this.Client.Animations[this.Current]) as SetAnimation

        if (Previous !== Next) {
            this.Speed = 1
            Network.Replication.AnimationChanged.client.FireServer(0, this.Current, this.Speed, 2)

            const TargetTime = this.GetTransitions(Previous, Next)

            this.UpdateState(Previous, false, TargetTime)
            this.UpdateState(Next, true, TargetTime)
            this.CalculateWeightAndSpeed(Next, true)

            this.Last = this.Current
        }

        if (this.Speed !== this.LastSpeed) {
            Network.Replication.AnimationChanged.client.FireServer(0, this.Current, this.Speed, 1)
            this.LastSpeed = this.Speed
        }

        this.UpdateCurrent(Next, DeltaTime)
    }

    public GetRate() {
        const Track = this.GetCurrentTrack(this.Client.Animations[this.Current])

        return //Track && Track.Length > 0 ? Track.Speed / Track.Length : 0
    }
}