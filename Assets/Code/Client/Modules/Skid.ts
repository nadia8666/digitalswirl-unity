import Client from "Code/Client/Client"
import { PhysicsHandler } from "Code/Client/Physics/Physics"
import { SrcState } from "./State"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckSkid(Client: Client) {
    if (Client.Speed.x < Client.Physics.JogSpeed) { return }

    const [HasControl, Turn] = Client.Input.Get()

    const Skid = HasControl && (math.abs(Turn) > math.rad(135)) || false

    if (Skid) {
        Client.Sound.Play("Character/Skid.wav")

        Client.Animation.Current = "Skid"
        Client.State.Current = Client.State.States.Skid
    }

    return Skid
}

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckStopSkid(Client: Client) {
    if (Client.Speed.x <= .01) {
        Client.Speed = Client.Speed.mul(new Vector3(0, 1, 1))
        Client.State.Current = Client.State.States.Grounded

        return true
    } else {
        const [HasControl, Turn] = Client.Input.Get()
        const StopSkid = HasControl && (math.abs(Turn) <= math.rad(135)) || false

        if (StopSkid) {
            Client.State.Current = Client.State.States.Grounded
        }

        return StopSkid
    }
}

/**
 * @class
 * @state
 * @augments SrcState
 */
export class StateSkid extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return CheckStopSkid(Client)
    }

    protected AfterUpdateHook(Client: Client) {
        PhysicsHandler.ApplyGravity(Client)
        PhysicsHandler.Skid(Client)
    }
}

