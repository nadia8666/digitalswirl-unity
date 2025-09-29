import { NetworkChannel } from "@Easy/Core/Shared/Network/NetworkAPI";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export const Network = {
    Replication: {
        AnimationChanged: new NetworkSignal<[number, string, number, number]>("Replication:AnimationChanged", NetworkChannel.Unreliable)
    },

    Respawn: new NetworkSignal<[]>("Respawn"),
    EnableClient: new NetworkSignal<[number]>("EnableClient"),
}