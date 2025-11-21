import Client from "Code/Client/Client"
import { PhysicsHandler } from "Code/Client/Physics/Physics"
import { SrcState } from "./State"
import { CheckJump } from "./Jump"
import { CheckRail } from "./Rail"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckSpindash(Client: Client) {
    if (Client.Input.Button.Spindash.Pressed) {
        Client.State.Current = Client.State.States.Spindash
        Client.Flags.SpindashSpeed = math.max(Client.Speed.x, 3)
        Client.EnterBall()

        Client.Sound.Play("Character/SpindashCharge.wav", {
            CompleteConfig: {
                Loop: true
            },
            PlayOnComplete: "Character/SpindashChargeLoop.wav"
        })

        return true
    }
}

/**
 * @class
 * @state
 * @augments SrcState
 */
export class StateSpindash extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        if (Client.Input.Button.Spindash.Activated) {
            if (Client.Flags.SpindashSpeed < 10) {
                Client.Flags.SpindashSpeed += .4
            }
        } else {
            // Release
            Client.Sound.Stop("Character/SpindashCharge.wav")
            Client.Sound.Stop("Character/SpindashChargeLoop.wav")
            Client.Sound.Play("Character/SpindashRelease.wav")

            Client.Speed = Client.Speed.mul(new Vector3(0, 1, 1)).add(new Vector3(Client.Flags.SpindashSpeed, 0, 0))
            Client.EnterBall()
            Client.State.Current = Client.State.States.Roll
        }

        return CheckRail(Client)
    }

    protected AfterUpdateHook(Client: Client) {
        PhysicsHandler.ApplyGravity(Client)
        PhysicsHandler.Turn(Client, Client.Input.GetTurn(), undefined)
        PhysicsHandler.Skid(Client)
        //PhysicsHandler.AccelerateGrounded(Client)

        if (Client.Ground.Grounded) {
            Client.Animation.Current = "Spindash"
            Client.Animation.Speed = Client.Flags.SpindashSpeed / 10
        } else {
            Client.Animation.Current = "Roll"
            Client.State.Current = Client.State.States.Airborne
        }
    }
}

/**
 * @class
 * @state
 * @augments SrcState
 */
export class StateRoll extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        if (Client.Input.Button.Roll.Pressed || Client.Speed.x < Client.Physics.RollGetup) {
            // TODO: ceil clip
            Client.State.Current = Client.State.States.Grounded
            Client.ExitBall()

            return true
        }

        return CheckJump(Client) || CheckRail(Client)
    }

    protected AfterUpdateHook(Client: Client) {
        PhysicsHandler.ApplyInertia(Client)
        PhysicsHandler.Turn(Client, Client.Input.GetTurn(), undefined)

        if (Client.Ground.Grounded) {
            Client.Animation.Current = "Roll"
            Client.Animation.Speed = Client.Speed.x
        } else {
            Client.State.Current = Client.State.States.Airborne
        }
    }
}