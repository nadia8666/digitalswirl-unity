import Client from "Code/Client/Client"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckHomingAttack(Client: Client) {
    if (Client.Input.Button.Jump.Pressed && Client.Flags.BallEnabled) {
        // TODO: homing attack
        Client.Speed = new Vector3(math.max(Client.Speed.x, Client.Physics.HomingForce.AirDash), Client.Speed.y, Client.Speed.z)

        Client.ExitBall()
        Client.Flags.TrailEnabled = true
        Client.Animation.Current = "Fall"

        Client.Sound.Play("Character/Dash")

        return true
    }
}