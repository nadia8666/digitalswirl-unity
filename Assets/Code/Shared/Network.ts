import { NetworkFunction } from "@Easy/Core/Shared/Network/NetworkFunction";
import type { DrawInformation } from "./Types";

export const Network = {
	Replication: {
		GetInitialLinkData: new NetworkFunction<[string], [DrawInformation]>("Replication:GetInitialLinkData"),
	},
};
