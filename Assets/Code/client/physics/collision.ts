import Client from "../Client";
import * as VUtil from "Code/Shared/Common/Utility/VUtil"
import { Constants } from "Code/Shared/Common/Constants";
import { CFrame } from "Code/Shared/Types";

function GetAligned(Client: Client, Normal: Vector3) {
    if (Client.Angle.mul(Vector3.up).Dot(Normal) < -0.999) {
        return Quaternion.Euler(180, 0, 0).mul(Client.Angle)
    }

    return Quaternion.FromToRotation(Client.Angle.mul(Vector3.up), Normal).mul(Client.Angle)
}

function AlignNormal(Client: Client, Normal: Vector3) {
    Client.Angle = GetAligned(Client, Normal)
}

//Velocity cancel for walls
function VelCancel(Velocity: Vector3, Normal: Vector3) {
    const Dot = Velocity.Dot(Normal.normalized)
    if (Dot < 0) {
        return Velocity.sub((Normal.normalized).mul(Dot))
    }
    return Velocity
}

function LocalVelCancel(Client: Client, vel: Vector3, normal: Vector3) {
    return Client.ToLocal(VelCancel(Client.ToGlobal(vel), normal.normalized))
}

function LocalFlatten(Client: Client, vector: Vector3, normal: Vector3) {
    return Client.ToLocal(VUtil.Flatten(Client.ToGlobal(vector), normal.normalized))
}

function Raycast(From: Vector3, Direction: Vector3) {
    const [Hit, Position, Normal, Collider] = Physics.Raycast(From, Direction.normalized, Direction.magnitude, LayerMask.GetMask("GameLayer0"))
    Debug.DrawRay(From, Direction, Color.white, 1)

    if (Hit) {
        return $tuple(Collider.gameObject, Position, Normal, "Ground")
    } else {
        return $tuple(undefined, From.add(Direction), undefined, "Air")
    }
}

//Wall collision
function WallRay(Client: Client, Y: number, Direction: Vector3, Velocity: number) {
    //Raycast
    const ReverseDirection = Direction.mul(Client.Physics.Radius * Client.Physics.Scale)
    const From = Client.Position.add(Client.Angle.mul(Vector3.up.mul(Y)))
    const ForwardDirection = Direction.mul((Client.Physics.Radius + Velocity) * Client.Physics.Scale)

    const [Hit, Position, Normal] = Raycast(From, ForwardDirection)

    if (Hit) {
        return $tuple((Position?.sub(ReverseDirection))?.sub(From), Normal, Position)
    }

    return $tuple(undefined, undefined, undefined)
}

function CheckWallAttach(Client: Client, Direction: Vector3, Normal: Vector3) {
    const DirectionDot = Direction.Dot(Normal)
    const SpeedDot = Client.ToGlobal(Client.Speed).Dot(Normal)
    const UpDot = Client.Angle.mul(Vector3.up).Dot(Normal)
    return (DirectionDot < -0.35 && SpeedDot < -1.16 && UpDot > 0.5)
}

function WallAttach(Client: Client, InputNormal: Vector3) {
    const FUp = Client.Physics.Height * Client.Physics.Scale
    const FDown = FUp + (Client.Physics.PositionError * Client.Physics.Scale)
    const [Hit, Position, Normal] = Raycast(Client.Position.add(Client.Angle.mul(Vector3.up).mul(FUp)), InputNormal.mul(-FDown))

    if (Hit && Position) {
        Client.Position = Position
        Client.Angle = GetAligned(Client, Normal)
    }
}

function WallHit(Client: Client, Normal: Vector3) {
    Client.Speed = LocalVelCancel(Client, Client.Speed, Normal)
}

function WallCollide(Client: Client, Y: number, Direction: Vector3, Velocity: number, ForwardAttach: boolean, BackAttach: boolean) {
    //Positive and negative wall collision
    let [ForwardPos, ForwardNormal] = WallRay(Client, Y, Direction, math.max(Velocity, 0))
    let [BackwardPos, BackwardNormal] = WallRay(Client, Y, Direction.mul(-1), math.max(-Velocity, 0))

    //Clip with walls
    let ShouldMove = true
    if (ForwardPos && BackwardPos && ForwardNormal && BackwardNormal) {
        Client.Position = Client.Position.add((ForwardPos.add(BackwardPos)).div(2))
        const Middle = ForwardNormal.add(BackwardNormal)
        if (Middle.magnitude !== 0) {
            ForwardNormal = Middle.normalized
        } else {
            ForwardNormal = undefined
        }
        BackwardNormal = undefined
        ShouldMove = false
    } else if (ForwardPos) {
        Client.Position = Client.Position.add(ForwardPos)
    } else if (BackwardPos) {
        Client.Position = Client.Position.add(BackwardPos)
    }

    //Velocity cancelling
    if (ForwardNormal) {
        if (ForwardAttach && CheckWallAttach(Client, Direction, ForwardNormal)) {
            WallAttach(Client, ForwardNormal)
            ShouldMove = false
        } else {
            WallHit(Client, ForwardNormal)
        }
    }
    if (BackwardNormal) {
        if (BackAttach && CheckWallAttach(Client, Direction.mul(-1), BackwardNormal)) {
            WallAttach(Client, BackwardNormal)
            ShouldMove = false
        } else {
            WallHit(Client, BackwardNormal)
        }
    }
    return ShouldMove
}

/**
 * Run global collision for `Client`
 * @param Client
 */
export function RunCollision(Client: Client) {
    //Remember previous state
    const PreviousSpeed = Client.ToGlobal(Client.Speed)

    //Stick to moving floors
    if (Client.Ground.Grounded && Client.Ground.Floor && Client.Ground.FloorLast) {
        //const PreviousWorld = Client.Ground.FloorLast
        //const NewWorld = Client.Ground.Floor.transform
        //const RightDiff = Quaternion.FromToRotation(PreviousWorld.Rotation.mul(Vector3.right), NewWorld.right)

        //Client.Ground.FloorSpeed = NewWorld.position.sub(PreviousWorld.Position)
        //Client.Position = Client.Position.add(Client.Ground.FloorSpeed)
        //Client.Angle = RightDiff.mul(Client.Angle)
    }

    for (const i of $range(1, 4)) {
        //Remember previous position
        const PreviousPosition = Client.Position
        const PreviousMiddle = Client.GetMiddle()

        //Wall collision heights
        const HeightScale = 1
        const Heights = [
            Client.Physics.Height * 0.85 * Client.Physics.Scale * HeightScale,
            Client.Physics.Height * 1.25 * Client.Physics.Scale * HeightScale,
            Client.Physics.Height * 1.95 * Client.Physics.Scale * HeightScale,
        ]

        //Wall collision and horizontal movement
        {
            let XMove = true
            let ZMove = true
            for (const [i, v] of pairs(Heights)) {
                if (WallCollide(Client, v, Client.Angle.mul(Vector3.forward), Client.Speed.x, (Client.Ground.Grounded || (Client.Speed.y <= 0)) && (i === 1), false) === false) {
                    XMove = false
                }
                if (WallCollide(Client, v, Client.Angle.mul(Vector3.right), Client.Speed.z, false, false) === false) {
                    ZMove = false
                }
            }

            if (XMove) {
                Client.Position = Client.Position.add(Client.Angle.mul(Vector3.forward).mul(Client.Speed.x * Client.Physics.Scale))
            }
            if (ZMove) {
                Client.Position = Client.Position.add(Client.Angle.mul(Vector3.right).mul(Client.Speed.z * Client.Physics.Scale))
            }
        }

        //Ceiling collision
        {
            let CeilUp = Client.Physics.Height * Client.Physics.Scale
            let CeilDown = CeilUp

            if (Client.Speed.y > 0) {
                CeilDown += Client.Speed.y * Client.Physics.Scale //Moving upwards, extend raycast upwards
            } else if (Client.Speed.y < 0) {
                CeilUp += Client.Speed.y * Client.Physics.Scale //Moving downwards, move raycast downwards
            }

            const From = Client.Position.add(Client.Angle.mul(Vector3.up).mul(CeilUp))
            const Direction = Client.Angle.mul(Vector3.up).mul(CeilDown)
            const [Hit, Position, Normal] = Raycast(From, Direction)

            if (Hit && Position && Normal) {
                if (Client.Ground.Grounded) {
                    //Set ceiling clip flag
                    //Client.flag.ceiling_clip = nor:Dot(Client.gravity.normalized) > 0.9 // TODO: ceil clip
                } else {
                    //Clip and cancel velocity
                    Client.Position = Position.sub((Client.Angle.mul(Vector3.up).mul((Client.Physics.Height * 2 * Client.Physics.Scale))))
                    Client.Speed = LocalVelCancel(Client, Client.Speed, Normal)
                    //Client.flag.ceiling_clip = false
                }
            }
        }

        //Floor collision
        {
            let PositionError = Client.Ground.Grounded && (Client.Physics.PositionError * Client.Physics.Scale) || 0
            let FloorUp = Client.Physics.Height * Client.Physics.Scale
            let FloorDown = -(FloorUp + PositionError)

            if (Client.Speed.y < 0) {
                FloorDown += Client.Speed.y * Client.Physics.Scale //Moving downwards, extend raycast downwards
            } else if (Client.Speed.y > 0) {
                FloorUp += Client.Speed.y * Client.Physics.Scale //Moving upwards, move raycast upwards
            }

            const From = Client.Position.add(Client.Angle.mul(Vector3.up).mul(FloorUp))
            const Direction = Client.Angle.mul(Vector3.up).mul(FloorDown)
            let [Hit, Position, Normal] = Raycast(From, Direction)
            print(Hit)

            //Do additional collision checks
            if (Hit && Position && Normal) {
                let DropOff = false

                if (Hit.CompareTag("NoFloor")) {
                    //Floor cannot be stood on under any conditions
                    DropOff = true
                } else if (Client.Ground.Grounded) {
                    //Don't stay on the floor if we're going too slow on a steep floor
                    if (Client.Angle.mul(Vector3.up).Dot(Normal) < 0.3) {
                        DropOff = true
                    } else if (Normal.Dot(Client.Flags.Gravity.normalized.mul(-1)) < 0.4) {
                        if (((Client.Speed.x ^ 2) + (Client.Speed.z ^ 2)) < (1.16 ^ 2)) {
                            DropOff = true
                        }
                    }
                } else {//Don't collide with the floor if we won't land at a speed fast enough to stay on it
                    const NextSpeed = VUtil.Flatten(Client.ToGlobal(Client.Speed), Normal)
                    const NextAng = GetAligned(Client, Normal)
                    const NextLocalSpeed = (Quaternion.Inverse(NextAng).mul(NextSpeed)).mul(new Vector3(1, 0, 1))

                    if (Normal.Dot(Client.Flags.Gravity.normalized.mul(-1)) < 0.4) {
                        if (NextLocalSpeed.magnitude < 1.16) {
                            DropOff = true
                        }
                    }
                }


                //Do simple collision
                if (DropOff) {
                    Client.Speed = LocalVelCancel(Client, Client.Speed, Normal)
                    Client.Position = Position
                    Hit = undefined
                }
            }

            //Do standard floor collision
            if (Hit && Position && Normal) {
                //Snap to ground
                Client.Position = Position
                Client.Ground.Floor = Hit.transform

                //Align with ground
                if (!Client.Ground.Grounded) {
                    Client.Speed = VUtil.Flatten(Client.ToGlobal(Client.Speed), Normal)

                    Client.Ground.Grounded = true
                    AlignNormal(Client, Normal)

                    Client.Speed = Client.ToLocal(Client.Speed)
                } else {
                    Client.Ground.Grounded = true
                    AlignNormal(Client, Normal)
                }

                //Kill any lingering vertical speed
                Client.Speed = Client.Speed.WithY(0)
            } else {
                //Move vertically and unground
                Client.Position = Client.Position.add(Client.Angle.mul(Vector3.up).mul(Client.Speed.y * Client.Physics.Scale))
                Client.Ground.Grounded = false
                Client.Ground.Floor = undefined
            }
        }

        //Check if we clipped through something from our previous position to our new position
        const NewMiddle = Client.GetMiddle()
        if (NewMiddle !== PreviousMiddle) {
            const NewAdd = NewMiddle.sub(PreviousMiddle).normalized.mul((Client.Physics.Radius * Client.Physics.Scale))
            const NewEnd = NewMiddle// + new_add
            const [Hit, Position, Normal] = Raycast(PreviousMiddle, NewEnd.sub(PreviousMiddle))
            if (Hit && Position && Normal) {
                //Clip us out
                print("clip")
                Client.Position = Client.Position.add((Position.sub(NewAdd)).sub(NewMiddle))
                Client.Speed = LocalVelCancel(Client, Client.Speed.mul(.8), Normal) // TODO: see if you can do without?
            }
            else {
                Client.Object.CollideWithClient()
                break
            }
        } else {
            break
        }
    }

    //Check if we're submerged in water
    //Client.flag.underwater = PointInWater(Client.pos + Client.GetUp() * (Client.Physics.height * Client.Physics.scale)) // TODO: water

    //Handle floor positioning
    if (Client.Flags.Gravity && Client.Ground.Floor) {
        Client.Ground.FloorLast = CFrame.FromTransform(Client.Ground.Floor.transform)

        const Rigid = Client.Ground.Floor.GetComponent<Rigidbody>()
        if (!Client.Ground.FloorSpeed && Rigid) {
            Client.Ground.FloorSpeed = Rigid.GetRelativePointVelocity(Client.Position).div(Constants.Tickrate)
        }
    } else {
        Client.Ground.Floor = undefined
        Client.Ground.FloorLast = undefined

        Client.Speed = Client.Speed.add(Client.ToLocal(Client.Ground.FloorSpeed).div(Client.Physics.Scale))

        Client.Ground.FloorSpeed = Vector3.zero
    }
}