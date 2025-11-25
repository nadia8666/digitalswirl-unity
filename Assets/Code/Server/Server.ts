import { Airship } from "@Easy/Core/Shared/Airship";
import { Asset } from "@Easy/Core/Shared/Asset";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { NetworkUtil } from "@Easy/Core/Shared/Util/NetworkUtil";
import { Network } from "Code/Shared/Network";

export default class Spawner extends AirshipSingleton {
    public Characters = new Map<Player, number>()

    public SpawnCharacter(Player: Player) {
        if (Player.userId === "loading")
            while (Player.userId === "loading") task.wait()

        const Character = Instantiate(Asset.LoadAsset("Assets/Resources/Prefabs/Sonic.prefab"), this.transform.position, this.transform.rotation)
        NetworkServer.Spawn(Character, Player.networkIdentity.connectionToClient as unknown as NetworkConnection)

        const Identity = Character.GetComponent<NetworkIdentity>()!
        Network.EnableClient.server.FireAllClients(Identity.netId, Player.userId)

        this.Characters.set(Player, Identity.netId)
    }

    public DestroyCharacter(Player: Player) {
        const ID = this.Characters.get(Player)
        
        if (ID) {
            const Model = NetworkUtil.GetNetworkIdentity(ID)
            
            if (Model) {
                Destroy(Model.gameObject)
                NetworkServer.Destroy(Model.gameObject)
            }
        }

        this.Characters.delete(Player)
    }

    @Server()
    override Start() {
        // Fired when players join the game
        Airship.Players.ObservePlayers((Player) => this.SpawnCharacter(Player));

        Airship.Players.onPlayerDisconnected.Connect((Player) => this.DestroyCharacter(Player))

        Network.Respawn.server.OnClientEvent((Player) => {
            this.DestroyCharacter(Player)
            this.SpawnCharacter(Player)
        })

        Network.Replication.ChangedPacket.server.OnClientEvent((Player, Changes) => {
            const Character = this.Characters.get(Player)

            if (Character) {
                Network.Replication.ChangedPacket.server.FireExcept(Player, Changes, Character)
            }
        })

        Network.Replication.InitialPacket.server.OnClientEvent((Player, Changes) => {
            const Character = this.Characters.get(Player)

            if (Character) {
                Network.Replication.InitialPacket.server.FireExcept(Player, Changes, Character)
            }
        })
    }
}