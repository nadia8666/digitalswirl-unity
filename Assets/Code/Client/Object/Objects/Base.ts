import Framework from "Code/Client/Framework"
import { RegisterObject } from "../ObjectController"
import { Bin } from "@Easy/Core/Shared/Util/Bin"
import Client from "Code/Client/Client"
import { Reflect } from "@Easy/Core/Shared/Flamework"

export default class _OBJBase extends AirshipBehaviour {
    public Collider: BoxCollider
    protected Connections = new Bin()
    protected Debounce = 0

    override Start() {
        if ($CLIENT) {
            this.InitObject()
        }
    }

    public InitObject() {
        RegisterObject(this)
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