import { DrawInformation } from "./Types";
import { NetworkFunction } from "@Easy/Core/Shared/Network/NetworkFunction";

export const Network = {
	Replication: {
		GetInitialLinkData: new NetworkFunction<[string], [DrawInformation]>("Replication:GetInitialLinkData"),
	},
};
