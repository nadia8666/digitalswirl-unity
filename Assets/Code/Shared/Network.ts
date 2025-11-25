import { NetworkChannel } from "@Easy/Core/Shared/Network/NetworkAPI";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { DrawInformation } from "./Types";

export const Network = {
    Replication: {
        ChangedPacket: new NetworkSignal<[Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>, number?]>("Replication:ChangedPacket", NetworkChannel.Unreliable),
        InitialPacket: new NetworkSignal<[Map<keyof DrawInformation, DrawInformation[keyof DrawInformation]>, number?]>("Replication:InitialPacket", NetworkChannel.Reliable),
    },

    Respawn: new NetworkSignal<[]>("Respawn"),
    EnableClient: new NetworkSignal<[number, string]>("EnableClient"),
}