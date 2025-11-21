import Client from "Code/Client/Client"
import { PhysicsHandler } from "../Physics/Physics"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckJump(Client: Client) {
    if (Client.Input.Button.Jump.Pressed) {
        Client.State.Current = Client.State.States.Airborne

        Client.Speed = Client.Speed.WithY(Client.Physics.JumpInitalForce).add(Client.Ground.FloorSpeed)

        Client.Ground.Grounded = false
        Client.Flags.JumpTimer = Client.Physics.JumpTicks

        Client.EnterBall()
        Client.Animation.Current = "Roll"
        Client.Animation.Speed = Client.Speed.x

        Client.Sound.Play("Character/Jump.wav")

        return true
    }
}