import Client from "Code/client/client"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckJump(Client: Client) {
    if (Client.Input.Button.Jump.Pressed) {
        Client.State.Current = Client.State.States.Airborne
        Client.Speed = Client.Speed.add(new Vector3(0, Client.Physics.JumpInitalForce, 0))

        Client.Ground.Grounded = false
        Client.Flags.JumpTimer = Client.Physics.JumpTicks

        Client.EnterBall()
        Client.Animation.Current = "Roll"
        Client.Animation.Speed = Client.Speed.x

        Client.Sound.Play("Character/Jump")

        return true
    }
}