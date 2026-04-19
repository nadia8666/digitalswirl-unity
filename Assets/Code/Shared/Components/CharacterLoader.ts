import { Asset } from "@Easy/Core/Shared/Asset";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import DSClient from "Code/Client/Client";
import ClientReplicator from "Code/Client/Replication";

export default class CharacterLoader extends AirshipSingleton {
	@Client()
	public SpawnCharacter(Player: Player) {
		const Character = Instantiate(Asset.LoadAsset("Assets/Resources/Prefabs/Sonic.prefab"), this.transform.position, this.transform.rotation);
		const [Client, Replicator] = [Character.GetAirshipComponent<DSClient>(true)!, Character.GetAirshipComponent<ClientReplicator>(true)!];

		Client.Player = Player;
		Client.enabled = Player === Game.localPlayer;

		Replicator.enabled = true;

		return $tuple(Character, Client, Replicator);
	}
}
