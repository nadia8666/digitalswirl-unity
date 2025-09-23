import { Connector } from "Code/shared/common/class/connector"
import { AddLog } from "Code/shared/common/utility/logger"
import { Client } from "Code/framework"

/**
 * @class
 * @object
 */
class SrcObject {
    public readonly Object: Model
    public readonly Root: BasePart
    public Debounce = 0
    protected Connections = new Connector()

    constructor(Object: Model) {
        if (!Object.PrimaryPart) {
            AddLog(`Failed to load object ${script.Name}! No PrimaryPart set!`)
            error()
        }

        this.Object = Object
        this.Root = Object.PrimaryPart
    }

    protected OnTick(GetClient: () => Client) {
        if (this.Debounce > 0) {
            this.Debounce--
        }
    }

    /**
     * Client touched callback
     * @param Client
     */
    protected OnTouch(Client: Client) { }

    /**
     * .RenderStepped callback
     * @param DeltaTime
     */
    protected PreRender(DeltaTime: number) { }

    protected OnRespawn() { }

    public Tick(GetClient: () => Client) {
        this.OnTick(GetClient)
    }

    public TouchClient(Client: Client) {
        if (this.Debounce > 0) { return }

        this.OnTouch(Client)
    }

    public Draw(DeltaTime: number) {
        this.PreRender(DeltaTime)
    }

    public Respawn() {
        this.OnRespawn()
    }
}

export = SrcObject