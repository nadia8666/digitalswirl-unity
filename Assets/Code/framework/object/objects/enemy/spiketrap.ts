import { Attributes } from "Code/shared/common/class/attributes";
import SrcObject from "../baseobj";
import { Client } from "Code/framework";

/**
 * @class
 * @object
 * @augments DamageBox
 * @augments BaseObj
 */
class SpikeTrap extends SrcObject {
    public Data
    public State: boolean = false
    public TickProgress: number = 0
    public CycleLength: number = 0
    public Permanant: boolean = false
    public Enabled: boolean = false

    constructor(Object: Model) {
        super(Object)

        this.Data = Attributes<{ CycleLength: number, Permanant: boolean }>(Object)
        this.CycleLength = this.Data.CycleLength
        this.Permanant = this.Data.Permanant

        this.Connections.Add(this.Data("CycleLength").Connect(() => this.CycleLength = this.Data.CycleLength))
        this.Connections.Add(this.Data("Permanant").Connect(() => {
            this.Permanant = this.Data.Permanant

            if (this.Permanant) {
                this.State = true
                this.UpdateState()
            }
        }))

        if (this.Permanant) {
            this.State = true
        }

        this.UpdateState()
    }

    protected OnTick(GetClient: () => Client) {
        if (this.Debounce > 0) {
            this.Debounce--
        }

        if (this.Permanant) { return }

        this.TickProgress++

        if (this.TickProgress >= this.CycleLength) {
            this.TickProgress -= this.CycleLength

            this.State = !this.State

            this.UpdateState()

            if (this.State) {
                const Client = GetClient()
                const Offset = this.Root.GetPivot().PointToObjectSpace(Client.GetMiddle()).Abs()
                const Size = this.Root.Size
                const [X, Y, Z] = [Size.X / 2, Size.Y / 2, Size.Z / 2]

                if (Offset.X <= X && Offset.Y <= Y && Offset.Z <= Z) {
                    this.TouchClient(Client)
                }
            }
        }
    }

    protected UpdateState() {
        // TODO: change model
        this.Enabled = this.State;

        (this.Object.WaitForChild("Spikes") as Part).Transparency = this.Enabled ? 0 : 1
    }

    protected OnTouch(Client: Client) {
        if (!this.Enabled) { return }
        this.Debounce = 30

        Client.Damage(this.Root.Position)
        Client.Sound.Play("Object/SpikeTrap/Hurt")
    }

    protected OnRespawn() {
        this.State = this.Permanant && true || false
        this.TickProgress = 0
        this.UpdateState()
    }
}

export = SpikeTrap