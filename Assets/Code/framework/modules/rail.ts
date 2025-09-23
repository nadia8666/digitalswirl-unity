import { Client } from "Code/framework"
import { Workspace } from "Code/shared/common/globals"
import { CheckJump } from "./jump"
import { SrcState } from "./state"

/**
 * Rail component interface
 * 
 * @playerComponent
 * @injects Client
 */
export class Rail {
    public Current: BasePart | undefined
    public RailDirection: number = 1
    public RailBalance: number = 0
    public RailTargetBalance: number = 0
    public RailOffset: Vector3 = Vector3.zero
    public RailTrick: number = 0
    public RailSound: Sound | undefined
    public RailGrace: number = 0
    public RailBonusTime: number = 0
    public RailDebounce: number = 0
    public BalanceEnabled: boolean = true
    public BalanceFail: number = 0

    public Connections: RBXScriptConnection[] = []
}

export function RailActive(Client: Client) {
    return Client.State.Current === Client.State.States.Rail && Client.Rail.RailOffset.Magnitude < 0.5
}

export function GetRailPosition(Client: Client) {
    assert(Client.Rail.Current, "GetRailPosition() called without Client.Rail.Current being set, did you mean to call this function?")
    const Offset = Client.Rail.Current.CFrame.Inverse().mul(Client.Position)

    return Client.Rail.Current.CFrame.mul(new Vector3(0, Client.Rail.Current.Size.Y / 2, Offset.Z))
}

export function GetRailAngle(Client: Client) {
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
}

export function SetRail(Client: Client, Part?: Part) {
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
        const Look = CFrame.lookAt(LastPosition, Client.Position)
        const Magnitude = LastPosition.sub(Client.Position).Magnitude

        const Cast = Workspace.Spherecast(LastPosition.sub(Look.LookVector.mul(Rail.Skin)), Rail.Skin, Look.LookVector.mul(Magnitude + Rail.Skin), Rail.Params)
        if (Cast) {
            SetRail(Client, Cast.Instance as Part)
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
    public Params: RaycastParams
    public Skin: number = 2

    constructor() {
        super()

        this.Params = new RaycastParams()
        this.Params.FilterDescendantsInstances = [Workspace.Level.Rails]
        this.Params.FilterType = Enum.RaycastFilterType.Include
    }

    protected CheckInput(Client: Client) {
        if (CheckJump(Client)) {
            SetRail(Client)

            return true
        }
    }

    protected BeforeUpdateHook(Client: Client) {
        const Rail = Client.Rail

        //Immediately quit if not on a rail
        if (!Rail.Current) { return }

        //Get grinding state
        const Crouching = Client.Input.Button.Roll.Pressed

        //Gravity
        const Weight = Client.GetWeight()
        // TODO: Water detection

        let Gravity = (Client.ToLocal(Client.Flags.Gravity).mul(Weight)).X

        //Amplify gravity
        if (math.sign(Gravity) === math.sign(Client.Speed.X)) {
            //Have stronger gravity when gravity is working with us
            Gravity *= (1.125 + (math.abs(Client.Speed.X) / 8))
        } else {
            //Have weaker gravity when gravity is working against us
            Gravity *= (0.5 / (1 + (math.abs(Client.Speed.X) / 3.5))) * (Crouching && 0.75 || 1)
        }

        //Get drag factor
        const BalanceDiff = Rail.RailBalance - Rail.RailTargetBalance
        Rail.RailTargetBalance *= 0.875

        let Drag = Rail.BalanceEnabled && (0.5 + (1 - math.cos(math.clamp(BalanceDiff, -math.pi / 2, math.pi / 2))) * 3.125) || 0.95

        //Apply gravity and drag
        Client.Speed = Client.Speed.add(new Vector3(Gravity, 0, 0))
        Client.Speed = Client.Speed.add(new Vector3(Client.Speed.X * Client.Physics.AirResist.X * (Crouching && 0.675 || 0.875) * Drag, 0, 0))

        //Make sure player is at a minimum speed
        if (Client.Speed.X === 0) {
            Client.Speed = new Vector3(Client.Physics.JogSpeed, Client.Speed.Y, Client.Speed.Z)
        } else if (math.abs(Client.Ground.DotProduct) > .95) {
            Client.Speed = new Vector3(math.max(math.abs(Client.Speed.X), Client.Physics.JogSpeed) * math.sign(Client.Speed.X), Client.Speed.Y, Client.Speed.Z)
        }

        //Give rail bonus at high speed
        if (math.abs(Client.Speed.X) >= 8) {
            Rail.RailBonusTime++
            if (Rail.RailBonusTime >= 60) {
                Client.CollectState.AddScore(Client.Speed.X < 0 && 1000 || 700)
                Rail.RailBonusTime = 0
            }
        } else {
            Rail.RailBonusTime = math.max(Rail.RailBonusTime - 2, 0)
        }

        //Balancing
        const StickX = Client.Input.Stick.X * math.clamp(Client.Speed.X, -1, 1)

        if (RailActive(Client) && Rail.BalanceEnabled) {
            //Drag balance
            const Drag = math.lerp(math.cos(Rail.RailTargetBalance), 1, .25)
            Rail.RailBalance *= math.lerp(1, Crouching && .9675 || .825, Drag)

            //Adjust balance using analogue stick
            let AdjustForce = (math.sign(Rail.RailBalance) === math.sign(StickX) && (math.cos(Rail.RailBalance) * 1.2125) || (1.6125 + math.abs(Rail.RailBalance / 1.35))) * (Crouching && 0.8975 || 1)
            Rail.RailBalance += StickX * AdjustForce * math.rad(3.5 + math.abs(Client.Speed.X) / 2.825)

            if (math.sign(StickX) === math.sign(Rail.RailTargetBalance)) {
                const Diff = Rail.RailTargetBalance - Rail.RailBalance
                Rail.RailBalance += Diff * math.abs(StickX) * math.abs(math.sign(Rail.RailTargetBalance)) * 0.15
            }
        } else {
            //Balancing disabled
            Rail.RailBalance *= 0.825
        }
    }

    protected AfterUpdateHook(Client: Client) {
        const Rail = Client.Rail
        const Crouching = Client.Input.Button.Roll.Pressed
        assert(Rail.Current)

        //Move
        Rail.RailOffset = Rail.RailOffset.mul(0.8)

        //Balance failing
        if (math.abs(Rail.RailBalance - Rail.RailTargetBalance) >= math.rad(55)) {
            Rail.BalanceFail = math.min(Rail.BalanceFail + 0.1, 1)
        } else {
            Rail.BalanceFail = math.min(Rail.BalanceFail - 0.04, 1)
        }

        //Run sound 
        const Active = RailActive(Client)
        if (Active) {
            if (!Rail.RailSound) {
                // Play sounds
                Client.Sound.Play("Character/GrindContact")
                Rail.RailSound = Client.Sound.Play("Character/Grind", { BoundState: "Rail" })
            }

            // Set sound volume
            if (Rail.RailSound) {
                Rail.RailSound.Volume = math.sqrt(math.abs(Client.Speed.X) / 8)
            }
        } else {
            if (Rail.RailSound) {
                Client.Sound.Stop("Character/GrindContact")
                Client.Sound.Stop("Character/Grind")
            }
        }


        //Set animation
        if (RailActive(Client)) {
            if (Client.Animation.Current !== "RailLand") {
                if (Rail.BalanceFail >= .3) {
                    Client.Animation.Current = "RailBalance"
                } else {
                    Client.Animation.Current = Crouching && "RailCrouch" || "Rail"
                    Client.Animation.Speed = Client.Speed.X
                }
            }
        } else {
            const LocalOffset = Client.Angle.Inverse().mul(Rail.RailOffset)

            Client.Animation.Current = (LocalOffset.X === 0 && Client.Animation.Current) || `RailSwitch${LocalOffset.X < 0 && "Left" || "Right"}`
        }

        if (Rail.RailGrace > 0) {
            Rail.RailGrace--

            if (Rail.RailGrace <= 0) {
                SetRail(Client)

                return
            }
        } else {
            while (true) {
                Client.Position = GetRailPosition(Client)
                Client.Angle = GetRailAngle(Client)

                const Direction = Rail.RailDirection * math.sign(Client.Speed.X)
                const Offset = Rail.Current.CFrame.Inverse().mul(Client.Position)
                if (Client.Speed.X !== 0 && ((Offset.Z * -Direction) > Rail.Current.Size.Z / 2)) {
                    const Cast = Workspace.Raycast(Rail.Current.Position, Rail.Current.CFrame.LookVector.mul((Rail.Current.Size.Z / 2) + 1).mul(Direction), this.Params)
                    if (Cast) {
                        SetRail(Client, Cast.Instance as Part)
                    } else {
                        Rail.RailGrace = 1 + math.floor(math.abs(Client.Speed.X) / 3.5)
                        break
                    }
                } else {
                    break
                }
            }
        }

        if (!Client.Rail.Current && Client.State.Current === Client.State.States.Rail) {
            Client.State.Current = Client.State.States.Airborne
        }
    }

    protected OnStep(Client: Client) {
        if (Client.Rail.RailDebounce > 0) {
            Client.Rail.RailDebounce--
        }
    }
}

