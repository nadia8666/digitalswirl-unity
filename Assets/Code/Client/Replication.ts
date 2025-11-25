import { Bin } from "@Easy/Core/Shared/Util/Bin";
import Client from "./Client";
import { Network } from "Code/Shared/Network";
import { Renderer } from "./Draw/Renderer";
import { DrawInformation } from "Code/Shared/Types";
import { Animation } from "./Draw/Animation";

export default class ClientReplicator extends AirshipBehaviour {
    public Connections = new Bin()
    public Client: Client
    public Net: NetworkIdentity

    @NonSerialized() public Draw: Renderer
    @NonSerialized() public Animation: Animation
    @NonSerialized() public IsHost: boolean

    public Arguments = new Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>()
    public Changed = new Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>()

    override Start() {
        this.IsHost = this.Client.enabled

        print(`Starting replication as ${this.IsHost ? "Host!" : "Peer!"}`)

        if (!this.IsHost) {
            this.Connections.Add(Network.Replication.ChangedPacket.client.OnServerEvent((ChangedArgs, NetID) => this.UpdateArgs(ChangedArgs, NetID!)))
            this.Connections.Add(Network.Replication.InitialPacket.client.OnServerEvent((ChangedArgs, NetID) => this.UpdateArgs(ChangedArgs, NetID!)))

            this.Draw = new Renderer(this.Client.transform, this.Client.RigParent)
            this.Animation = new Animation(this.Client.EventListener, this.Client.RigParent.transform, this.Client.Animations, this.Client.Controller, {} as unknown as DrawInformation)
        
            return
        }

        const DrawInfo = this.Client.GetRenderInfo()
        Network.Replication.InitialPacket.client.FireServer(DrawInfo as unknown as Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>)
    }

    override OnDestroy() {
        this.Draw.Destroy()
        this.Connections.Clean()
    }

    override LateUpdate(DeltaTime: number) {
        // host only sends data
        if (this.IsHost) {
            const DrawInfo = this.Client.GetRenderInfo()

            for (const [Index, Value] of pairs(DrawInfo)) {
                if (this.Arguments.get(Index) !== Value)
                    this.Changed.set(Index, Value)

                this.Arguments.set(Index, Value)
            }

            if (this.Changed.size() > 0) {
                print(this.Changed)
                Network.Replication.ChangedPacket.client.FireServer(this.Changed)
                this.Changed.clear()
            }
            
            return
        }

        // client does all the work to piece it together
        this.Draw.Draw(DeltaTime, this.Arguments as unknown as DrawInformation)
        this.Animation.Animate(DeltaTime)

        this.Animation.DynamicTilt(DeltaTime)
    }

    public UpdateArgs(ChangedArgs: Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>, NetID: number) {
        if (this.Net.netId === NetID) {
            for (const [Index, Value] of ChangedArgs) {
                const ArgExists = this.Arguments.get(Index)

                if (ArgExists)
                    if (typeOf(ArgExists) !== typeOf(Value)) continue

                this.Arguments.set(Index, Value)
            }
        }
    }
}