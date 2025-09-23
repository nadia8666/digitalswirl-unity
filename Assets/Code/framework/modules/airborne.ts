import { Client } from "Code/framework"
import { PhysicsHandler } from "Code/framework/physics/physics"
import { CheckBounce } from "./bounce"
import { CheckHomingAttack } from "./homing"
import { SrcState } from "./state"
import { CheckRail } from "./rail"
import { CheckAirKick } from "./airkick"

/**
 * @class
 * @augments SrcState
 */
export class StateAirborne extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return CheckHomingAttack(Client) || CheckAirKick(Client) || CheckBounce(Client) || CheckRail(Client)
    }

    protected BeforeUpdateHook(Client: Client) {
        if (Client.Animation.Current === "Spring" && Client.Speed.Y <= .5) {
            Client.Animation.Current = "SpringEnd"
        }

        if (!Client.IsScripted()) {
            PhysicsHandler.ApplyGravity(Client)
            PhysicsHandler.AlignToGravity(Client)
        }

        PhysicsHandler.AccelerateAirborne(Client)
    }

    protected AfterUpdateHook(Client: Client) {
        if (Client.Ground.Grounded) {
            if (Client.Flags.InBounce) {
                Client.Flags.JumpTimer = 0
                const Speed = 1 + (math.abs(Client.Speed.X) / 16)
                Client.Speed = Client.Speed.mul(new Vector3(1, 0, 1)).add(new Vector3(0, Speed * (Client.Flags.Bounces === 0 && 2.825 || 3.575)))

                Client.Flags.Bounces++

                Client.Flags.InBounce = false
            } else {
                Client.Sound.Play("Character/Land")

                Client.State.Current = Client.State.States.Grounded
                Client.Land()
            }
        }
    }
}