import Client from "Code/Client/Client"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckJump(Client: Client) {
    if (Client.Input.Button.Jump.Pressed) {
        Client.State.Current = Client.State.States.Airborne

        Client.Speed = Client.Speed.WithY(Client.Config.JumpInitialForce).add(Client.Ground.FloorSpeed)

        Client.Ground.Grounded = false
        Client.Flags.JumpTimer = Client.Config.JumpTicks
        Client.StretchJumpBall()

        Client.EnterBall()
        Client.Animation.Current = "Roll"
        Client.Animation.Speed = Client.Speed.x

        Client.Sound.Play("Character/Jump.wav")

        return true
    }
}