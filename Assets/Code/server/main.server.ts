import { Players, RunService } from "Code/@rbxts/services"
import Net, { Route } from "Code/@rbxts/yetanothernet"
import * as Routes from "Code/shared/common/replication/routes"

RunService.Heartbeat.Connect(() => {
    /*
    for (const [_, Sender, Packet] of UpdateRoute.query()) {
        if (typeIs(Sender, "string")) { continue }

        const PlayerList = Players.GetPlayers()

        for (const [_, Player] of pairs(Players.GetPlayers())) {
            if (Player !== Sender) {
                UpdateRoute.send(Packet).to(Player)
            }
        }
    } 
    */

    for (const [_, Sender] of Routes.RespawnRoute.query().server()) {
        print("hello im route")

        if (Sender && Sender.Parent === Players) {
            print("hello im load")
            Sender.LoadCharacter()
        }
    }
})