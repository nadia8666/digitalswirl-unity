import { Airship } from "@Easy/Core/Shared/Airship";
import type { Player } from "@Easy/Core/Shared/Player/Player";
import { Network } from "Code/Shared/Network";
import { type DrawInformation, GetRenderInfo } from "Code/Shared/Types";
import { DualLink } from "@inkyaker/DualLink/Code";

export default class DSServer extends AirshipSingleton {
	public Links = new Map<Player, DualLink<DrawInformation>>();

	@Server()
	override Start() {
		Airship.Players.ObservePlayers((Player) => {
			const Data = new DualLink(`ReplicationData@${Player.userId}`, GetRenderInfo(), {
				AllowUpdateFrom: [Player],
			});

			this.Links.set(Player, Data);

			return () => {
				this.Links.delete(Player);
				Data.Destroy();
			};
		});

		Network.Replication.GetInitialLinkData.server.SetCallback((Player, ID) => {
			const TargetPlayer = Airship.Players.FindByUserId(ID)!;

			if (Player) {
				let Data: DualLink<DrawInformation> | undefined;
				while (!Data) {
					Data = this.Links.get(TargetPlayer);
					if (!Data) task.wait();
				}

				return Data.Data;
			}

			error(`Player not in the server!`);
		});
	}

	@Server()
	override LateUpdate() {
		for (const [_, Link] of pairs(this.Links)) {
			Link.PrepareReplicate();
		}
	}
}
