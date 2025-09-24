import Client from "Code/Client/Client"
import { SrcState } from "./State"
import { CheckRail } from "./Rail"
import { PhysicsHandler } from "Code/Client/Physics/Physics"

/**
 * @class
 * @augments SrcState
 */
export class StateHurt extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return CheckRail(Client)
    }

    protected BeforeUpdateHook(Client: Client) {
        PhysicsHandler.ApplyInertia(Client)
        PhysicsHandler.AlignToGravity(Client)
        Client.Ground.Grounded = false
    }

    protected AfterUpdateHook(Client: Client) {
        if (Client.Ground.Grounded) {
            Client.State.Current = Client.State.States.Grounded
            Client.Animation.Current = "Land"
            Client.Land()
            Client.Speed = Client.Speed.Lerp(Vector3.zero, math.abs(Client.Ground.DotProduct))
        } else if (Client.Flags.HurtTime > 0) {
            Client.Flags.HurtTime--

            if (Client.Flags.HurtTime <= 0) {
                Client.State.Current = Client.State.States.Airborne
                Client.Animation.Current = "Fall"
            }
        }
    }
}