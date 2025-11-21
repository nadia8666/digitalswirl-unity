import Client from "Code/Client/Client"
import { PhysicsHandler } from "../Physics/Physics"
import { SrcState } from "./State"
import { CheckBounce } from "./Bounce"
import { CFrame } from "Code/Shared/Types"
import { SignedAngle } from "Code/Shared/Common/Utility/VUtil"

/**
 * Function ran in `State.CheckInput`
 * @move
 * @param Client 
 * @returns Move successful
 */
export function CheckHomingAttack(Client: Client) {
    if (Client.Input.Button.Jump.Pressed && Client.Flags.BallEnabled) {
        const Object = PhysicsHandler.GetHomingObject(Client)
        Client.Flags.TrailEnabled = true

        Client.Sound.Play("Character/Dash.wav")

        if (Object) {
            Client.EnterBall()
            Client.Animation.Current = "Roll"
            Client.HomingAttack.Target = Object
            Client.HomingAttack.Timer = 0

            Client.State.Current = Client.State.States.Homing
        } else {
            Client.Animation.Current = "HomingAttack"
            Client.ExitBall()

            Client.State.Current = Client.State.States.Airborne
        }

        Client.Speed = new Vector3(math.max(Client.Speed.x, Client.Physics.HomingForce.AirDash), Client.Speed.y, Client.Speed.z)

        return true
    }
}

/**
 * @class
 * @augments SrcState
 */
export class StateHoming extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return CheckBounce(Client)
    }

    protected BeforeUpdateHook(Client: Client) {
        Client.Angle = CFrame.FromRotationBetweenVectors(Client.Angle.mul(Vector3.up), Vector3.up).mul(Client.Angle)

        const Collider = Client.HomingAttack.Target!.Collider

        const Center = Collider.transform.TransformPoint(Collider.center)
        const Look = Center.sub(Client.Position).mul(new Vector3(1, 0, 1)).normalized

        Debug.DrawRay(Client.Position, Look.mul(10), Color.black, 30)

        const MaxTurn = math.rad(35.25) * (1 + Client.HomingAttack.Timer / 180)
        const Turn = SignedAngle(Client.Angle.mul(Vector3.forward), Look, Vector3.up)

        PhysicsHandler.Turn(Client, math.clamp(Turn, -MaxTurn, MaxTurn))

        const ObjectPos = new CFrame(Client.Position, Client.Angle).Inverse().mul(Center)

        // Speed
        const Speed = Client.Physics.HomingForce.HomingAttack * (Client.HomingAttack.Timer >= 180 ? (.7 + math.random() * .1) : 1)

        if (ObjectPos.magnitude <= Collider.size.magnitude / 2) {
            Client.HomingAttack.Target!.TouchClient(Client)

            Client.HomingAttack.Timer += 300
        } else if (ObjectPos.magnitude > 0) {
            const ObjectSpeed = ObjectPos.normalized
            const ForwardSpeed = ObjectSpeed.mul(new Vector3(1, 0, 1)).magnitude

            Debug.DrawRay(Client.Position, Vector3.up.mul(ObjectSpeed.y * Speed), Color.green, 15)

            Client.Speed = new Vector3(ForwardSpeed * Speed, ObjectSpeed.y * Speed, 0)
        }

        Client.HomingAttack.Timer++

        if (Client.HomingAttack.Timer >= 300) {
            Client.State.Current = Client.State.States.Airborne

            Client.HomingAttack.Target = undefined
            Client.HomingAttack.Timer = 0
        }
    }

    protected AfterUpdateHook(Client: Client) {

    }
}