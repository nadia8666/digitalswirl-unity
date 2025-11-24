import Client from "Code/Client/Client"
import { CheckJump } from "./Jump"
import { SrcState } from "./State"
import { Signal } from "@Easy/Core/Shared/Util/Signal"
import { CFrame, ToFloat3 } from "Code/Shared/Types"
import { Constants } from "Code/Shared/Components/ConfigSingleton"

/**
 * Rail component interface
 * 
 * @playerComponent
 * @injects Client
 */
export class Rail {
    public Current: Transform | undefined
    public RailDirection: number = 1
    public RailBalance: number = 0
    public RailTargetBalance: number = 0
    public RailOffset: Vector3 = Vector3.zero
    public RailTrick: number = 0
    public RailSound: string | undefined
    public RailGrace: number = 0
    public RailBonusTime: number = 0
    public RailDebounce: number = 0
    public BalanceEnabled: boolean = true
    public BalanceFail: number = 0

    public Connections: Signal[] = []
}

export function RailActive(Client: Client) {
    return Client.State.Current === Client.State.States.Rail && Client.Rail.RailOffset.magnitude < 0.5
}

export function GetRailPosition(Client: Client) {
    assert(Client.Rail.Current, "GetRailPosition() called without Client.Rail.Current being set, did you mean to call this function?")
    const RailCFrame = CFrame.FromTransform(Client.Rail.Current)
    const Offset = RailCFrame.Inverse().mul(Client.Position)

    //return RailCFrame.mul(new Vector3(0, Client.Rail.Current.Size.Y / 2, Offset.Z))
}

export function GetRailAngle(Client: Client) {
    /*
     if (Client.Rail.Current) {
         let Angle
         if (Client.Rail.RailDirection >= 0) {
             Angle = 0
         } else {
             Angle = math.pi
         }
         return Client.Rail.Current.CFrame.Rotation.mul(CFrame.Angles(0, Angle, 0))
     }
     return Client.Angle
     */
}

export function SetRail(Client: Client, Part?: GameObject) {
    /*
    const Rail = Client.Rail

    if (Part) {
        const Direction = Client.Angle.LookVector.Dot(Part.CFrame.LookVector)
        const Speed = Client.ToGlobal(Client.Speed).Dot(Part.CFrame.LookVector)
        let RailDirection

        if (Direction !== 0) {
            RailDirection = math.sign(Direction)
        } else if (Speed !== 0) {
            RailDirection = math.sign(Speed)
        } else {
            RailDirection = 1
        }


        if (!Rail.Current) {
            Client.ResetObjectState()
            Client.Land()
            Client.State.Current = Client.State.States.Rail

            Rail.Current = Part
            Rail.RailDirection = RailDirection
            Rail.RailBalance = 0
            Rail.RailTargetBalance = 0
            Rail.BalanceFail = 0
            Rail.RailOffset = Vector3.zero
            Rail.RailTrick = 0
            Rail.RailSound = undefined
            Rail.RailGrace = 0
            Rail.RailBonusTime = 0

            const PreviousSpeed = Client.ToGlobal(Client.Speed)
            Client.Angle = GetRailAngle(Client)
            Client.Speed = new Vector3(Client.ToLocal(PreviousSpeed).X, 0, 0)

            if (math.abs(Client.Speed.X) < Client.Physics.JogSpeed && Client.ToLocal(PreviousSpeed).Y < -2) {
                Client.Animation.Current = "RailLand"
            } else {
                Client.Animation.Current = "Rail"
            }

            Client.Position = GetRailPosition(Client)
        } else if (Rail.Current !== Part) {
            const Dot = math.clamp(Rail.Current.CFrame.RightVector.Dot(Part.CFrame.LookVector), -.999, .999)
            Rail.Current = Part
            Rail.RailDirection = RailDirection

            const Balance = math.asin(Dot) * (Client.Speed.X / 10)
            Rail.RailBalance = math.clamp(Rail.RailBalance - Balance * 1.625, math.rad(-80), math.rad(80))
            Rail.RailTargetBalance = math.clamp(Rail.RailTargetBalance + Balance * 1.125, math.rad(-70), math.rad(70))

            Client.Angle = GetRailAngle(Client)
            Client.Position = GetRailPosition(Client)
        } else {
            return
        }

        Rail.BalanceEnabled = Part.Parent && Part.Parent.GetAttribute("Balance") && true || false
    } else if (Client.Rail.Current !== undefined) {
        Rail.Current = undefined
        Rail.RailDebounce = 25
        Rail.RailBalance = 0
        Rail.RailOffset = Vector3.zero
    } 
    */
}

/**
 * 
 * @move
 */
export function CheckRail(Client: Client) {
    if (Client.Rail.RailDebounce > 0 || Client.Rail.Current) { return false }
    const Rail = Client.State.States.Rail
    const LastPosition = Client.LastCFrame.Position

    if (LastPosition !== Client.Position) {
        const Rails = Physics.OverlapSphere(Client.Position, Client.Config.Radius*2, Constants().Masks().RailLayer)

        for (const [_, Collider] of pairs(Rails)) {
            const Spline = Collider.gameObject.GetComponent<SplineContainer>();
            
            if (!Spline) continue

            //const [NearpPos,Delta] = (SplineUtility as unknown as {GetNearestPoint<T>(this: SplineUtility, Spline: T, Point: float3, Res?: number, It?: number): [float3, number]}).GetNearestPoint(Spline, ToFloat3(Client.Position), 4, 2)

            //print(NearpPos, Delta)

            break
        }
    }

    return Client.State.Current === Client.State.States.Rail
}

/**
 * @class
 * @state
 * @augments SrcState
 */
export class StateRail extends SrcState {
    public Skin: number = 2

    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        if (CheckJump(Client)) {
            SetRail(Client)

            return true
        }
    }

    protected BeforeUpdateHook(Client: Client) {
        
    }

    protected AfterUpdateHook(Client: Client) {
        
    }

    protected OnStep(Client: Client) {
        if (Client.Rail.RailDebounce > 0) {
            Client.Rail.RailDebounce--
        }
    }
}

