import { RegisterObject } from "../ObjectController"
import { Bin } from "@Easy/Core/Shared/Util/Bin"
import Client from "Code/Client/Client"

export default class _OBJBase extends AirshipBehaviour {
    @NonSerialized() public Collider = this.gameObject.GetComponent<BoxCollider>()!
    @NonSerialized() public HomingTarget = false
    @NonSerialized() public HomingWeight = 1
    protected Connections = new Bin()
    protected Debounce = 0
    public readonly Injects = {
        AnimationLoader: false
    }

    override Start() {
        if ($CLIENT) {
            this.InitObject()
        }

        this.Inject()
    }

    /**
     * Runs on start for object implementation injection, override per object.
     */
    public Inject() {

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

        if (this.Injects.AnimationLoader) {
            (this as unknown as {Animate: (this: unknown) => void}).Animate()
        }
    }

    public Respawn() {
        this.OnRespawn()
    }
}