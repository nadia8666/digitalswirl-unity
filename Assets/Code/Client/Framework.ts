import DSClient from "./Client";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Player } from "@Easy/Core/Shared/Player/Player";
import CharacterLoader from "Code/Shared/Components/CharacterLoader";
import Link from "@inkyaker/DualLink/Code";
import { DrawInformation } from "Code/Shared/Types";
import { Network } from "Code/Shared/Network";

export default class Framework extends AirshipSingleton {
	@NonSerialized() public CurrentClient: DSClient | undefined = undefined;
	public Links = new Map<Player, Link<DrawInformation>>();
	public Characters = new Map<Player, GameObject>();

	@Client()
	public async PlayerAdded(Player: Player) {
		const Data = new Link(`ReplicationData@${Player.userId}`, Network.Replication.GetInitialLinkData.client.FireServer(Player.userId));

		const [Character, Client, Replicator] = CharacterLoader.Get().SpawnCharacter(Player);

		if (Client.enabled) this.CurrentClient = Client;

		this.Links.set(Player, Data);
		this.Characters.set(Player, Character);

		return () => this.PlayerRemoving(Player, Data);
	}

	@Client()
	public PlayerRemoving(Player: Player, Link: Link<DrawInformation>) {
		const Character = this.Characters.get(Player);
		if (Character) Destroy(Character);

		this.Characters.delete(Player);

		this.Links.delete(Player);
		Link.Destroy();
	}

	@Client()
	override Start() {
		for (const [_, Player] of pairs(Airship.Players.GetPlayers())) {
			pcall(() => this.PlayerAdded(Player));
		}

		Airship.Players.ObservePlayers((Player) => this.PlayerAdded(Player).expect());
	}
}
