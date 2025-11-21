import Client from "Code/Client/Client"
import { PhysicsHandler } from "Code/Client/Physics/Physics"
import { CheckBounce } from "./Bounce"
import { CheckHomingAttack } from "./Homing"
import { SrcState } from "./State"
import { CheckRail } from "./Rail"
import { CheckAirKick } from "./Airkick"

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
        if (Client.Animation.Current === "Spring" && Client.Speed.y <= .5) {
            Client.Animation.Current = "Fall"
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
                const Speed = 1 + (math.abs(Client.Speed.x) / 16)
                Client.Speed = Client.Speed.mul(new Vector3(1, 0, 1)).add(new Vector3(0, Speed * (Client.Flags.Bounces === 0 && 2.825 || 3.575), 0))
                Client.Animation.Speed = Client.Speed.x/2

                Client.Flags.Bounces++

                Client.Flags.InBounce = false
                Client.Sound.Play("Character/BounceLand.wav")
            } else {
                Client.Sound.Play("Character/Land.wav")

                if (math.abs(Client.Speed.x) > 2.215) {
                    Client.Animation.Current = "LandMoving"
                } else {
                    Client.Animation.Current = "Land"
                }

                Client.State.Current = Client.State.States.Grounded
                Client.Land()
            }
        }
    }
}