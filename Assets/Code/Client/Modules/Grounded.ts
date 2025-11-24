import Client from "Code/Client/Client"
import { PhysicsHandler } from "Code/Client/Physics/Physics"
import { CheckJump } from "./Jump"
import { CheckSkid } from "./Skid"
import { CheckSpindash } from "./Spindash"
import { SrcState } from "./State"
import { CheckRail } from "./Rail"

/**
 * @class
 * @augments SrcState
 */
export class StateGrounded extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return CheckJump(Client) || CheckSpindash(Client) || CheckSkid(Client) || CheckRail(Client)
    }

    protected BeforeUpdateHook(Client: Client) {
        if (Client.Speed.x === 0) {
            PhysicsHandler.RotateWithGravity(Client)
        }

        PhysicsHandler.ApplyGravity(Client)
        PhysicsHandler.AccelerateGrounded(Client)
    }

    protected AfterUpdateHook(Client: Client) {
        if (Client.Ground.Grounded) {
            const Slip = math.sqrt(1)
            const Acceleration = math.min(math.abs(Client.Speed.x) / Client.Config.CrashSpeed, 1)

            const IdleCheck = math.abs(Client.Speed.x) <= 0 ? (!Client.Animation.Current.find("Idle")[0] && !Client.Animation.Current.find("Land")[0]) : true
            if (Client.Animation.Current !== "LandMoving" && IdleCheck) {
                Client.Animation.Current = math.abs(Client.Speed.x) > 0 && "Run" || "Idle"
            }
            Client.Animation.Speed = Client.Animation.Current === "Run" && math.lerp(Client.Speed.x / Slip + (1 - Slip) * 2, Client.Speed.x, Acceleration) || 1
        } else {
            Client.Animation.Current = "Fall"
            Client.State.Current = Client.State.States.Airborne
        }
    }
}