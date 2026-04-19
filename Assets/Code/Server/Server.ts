import { Airship } from "@Easy/Core/Shared/Airship";
import { Player } from "@Easy/Core/Shared/Player/Player";
import Link from "@inkyaker/DualLink/Code";
import { Network } from "Code/Shared/Network";
import { DrawInformation, GetRenderInfo } from "Code/Shared/Types";

export default class DSServer extends AirshipSingleton {
	public Links = new Map<Player, Link<DrawInformation>>();

	@Server()
	override Start() {
		Airship.Players.ObservePlayers((Player) => {
			const Data = new Link(`ReplicationData@${Player.userId}`, GetRenderInfo(), {
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
				let Data;
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
