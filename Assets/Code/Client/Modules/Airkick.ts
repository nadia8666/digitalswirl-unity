import Client from "Code/Client/Client"
import { IntertiaState, PhysicsHandler } from "Code/Client/Physics/Physics"
import { SrcState } from "./State"
import { RunCollision } from "Code/Client/Physics/Collision"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckAirKick(Client: Client) {
    if (Client.Flags.AirKickEnabled && Client.Input.Button.AirKick.Pressed) {
        Client.ExitBall()
        Client.ResetObjectState()

        Client.CollectState.AddScore(100)
        Client.State.Current = Client.State.States.AirKick

        const KickUp = Client.Input.Get()[2] <= 0

        Client.Animation.Current = `AirKick${KickUp && "Up" || ""}`
        Client.Speed = new Vector3(KickUp && .2 || 4.5, KickUp && 2.65 || 1.425, 0)
        Client.State.States.AirKick.Timer = KickUp && 60 || 120

        return true
    }

    return false
}

/**
 * @class
 * @state
 * @augments SrcState
 */
export class AirKick extends SrcState {
    public Timer: number = 0

    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return
    }

    protected BeforeUpdateHook(Client: Client) {
        const [_, Turn, Magnitude] = Client.Input.Get()
        Client.Speed = Client.Speed.add(Client.Speed.mul(new Vector3(
            Client.Physics.AirResist.x * (.285 - Magnitude * .1),
            Client.GetAirResist().y,
            Client.Physics.AirResist.z
        )))
        Client.Speed = Client.Speed.add(Client.ToLocal(Client.Flags.Gravity).mul(Client.Physics.Weight * 0.4))

        PhysicsHandler.Turn(Client, Turn, IntertiaState.GROUND_NOFRICT)

        const FallSpeed = -Client.Speed.y
        Client.Ground.Grounded = false

        RunCollision(Client)

        if (Client.Ground.Grounded) {
            Client.State.Current = Client.State.States.Grounded
            Client.Land()

            if (FallSpeed > 0) {
                Client.Sound.Play("Character/Land")
            }
        } else {
            if (this.Timer <= 0 || Client.Speed.magnitude < .35) {
                Client.State.Current === Client.State.States.Airborne
                Client.Animation.Current = "Fall"
            }
        }

        Client.Animation.Current = "Spindash"

        return true // Do not process after hook
    }

    protected OnStep(Client: Client) {
        if (this.Timer > 0) {
            if (Client.State.Current === Client.State.States.AirKick) {
                this.Timer--
            } else {
                this.Timer = 0
            }
        }
    }
}

