import Client from "./client"
import { StateList } from "./states"
import { FrameworkState } from "Code/shared/common/frameworkstate"
import { SrcState } from "./modules/state"
import { CFrame } from "Code/shared/types"

/**
 * State machine
 * @class
 */
export class StateMachine {
    private Client: Client
    public TickTimer: number
    public States: StateList
    public Current: SrcState

    constructor(Client: Client) {
        this.States = new StateList

        this.TickTimer = os.clock()
        this.Client = Client
        this.Current = this.States.Airborne
    }

    public GetStateName(State: SrcState) {
        for (const [Name, Target] of pairs(this.States)) {
            if (Target === State) {
                return Name
            }
        }

        return ""
    }

    /**
     * Internal method for ticking the current state
     */
    private TickState() {
        this.Current.CheckMoves(this.Client)

        this.Current.Tick(this.Client)
    }

    /**
     * Update the state machine, **only run this if you know what you're doing!**
     */
    public Update(DeltaTime: number) {
        if (FrameworkState.GameSpeed === 0) {
            this.Client.Input.PrepareReset()
            this.Client.Input.Update()

            return
        }

        // Internal fixed update loop
        this.TickTimer = math.min(this.TickTimer + DeltaTime * (60 * FrameworkState.GameSpeed), 10)
        while (this.TickTimer > 1) {
            // Timers
            if (this.Client.Flags.LockTimer > 0) {
                this.Client.Flags.LockTimer--
            }

            if (this.Client.Flags.Invulnerability > 0) {
                this.Client.Flags.Invulnerability--
            }

            // Main update
            this.Client.Input.Update()
            this.Client.Input.PrepareReset()

            this.Client.Object.TickObjects()
            this.TickState()

            for (const [_, State] of pairs(this.States)) {
                State.Step(this.Client)
            }

            this.TickTimer--

            this.Client.LastCFrame = this.Client.CurrentCFrame
            this.Client.CurrentCFrame = new CFrame(this.Client.Position, this.Client.Angle)
        }
    }
}