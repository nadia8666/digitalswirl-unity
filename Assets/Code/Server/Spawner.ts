import { Airship } from "@Easy/Core/Shared/Airship";
import { Asset } from "@Easy/Core/Shared/Asset";

export default class Spawner extends AirshipSingleton {
    @Server()
    override Start() {
        // Fired when players join the game
        Airship.Players.ObservePlayers((player) => {
            const Character = Instantiate(Asset.LoadAsset("Assets/Resources/Models/Sonic.prefab"), this.transform.position, this.transform.rotation)
            NetworkServer.Spawn(Character, player.networkIdentity.connectionToClient as unknown as NetworkConnection)
        });
    }
}