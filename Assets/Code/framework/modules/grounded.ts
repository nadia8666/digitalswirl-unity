import { Client } from "Code/framework"
import { PhysicsHandler } from "Code/framework/physics/physics"
import { CheckJump } from "./jump"
import { CheckSkid } from "./skid"
import { CheckSpindash } from "./spindash"
import { SrcState } from "./state"
import { CheckRail } from "./rail"

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

    protected AfterUpdateHook(Client: Client) {
        PhysicsHandler.ApplyGravity(Client)
        //PhysicsHandler.Turn(Client, Client.Input.GetTurn(), undefined)
        PhysicsHandler.AccelerateGrounded(Client)

        if (Client.Ground.Grounded) {
            const Slip = math.sqrt(1)
            const Acceleration = math.min(math.abs(Client.Speed.X) / Client.Physics.CrashSpeed, 1)

            Client.Animation.Current = Client.Speed.X > 0 && "Run" || "Idle"
            Client.Animation.Speed = Client.Animation.Current === "Run" && math.lerp(Client.Speed.X / Slip + (1 - Slip) * 2, Client.Speed.X, Acceleration) || 1
        } else {
            Client.Animation.Current = "Fall"
            Client.State.Current = Client.State.States.Airborne
        }
    }
}