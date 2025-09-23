import { Client } from "..";
import * as VUtil from "Code/shared/common/utility/vutil";
import * as CFUtil from "Code/shared/common/utility/cfutil";

export enum IntertiaState {
    FULL_INERTIA,
    GROUND_NOFRICT,
}

export const PhysicsHandler = {
    // Acceleration
    /**
     * Apply grounded acceleration, gravity calculations are separate
     * @param Client 
     */
    AccelerateGrounded: (Client: Client) => {
        const MaxXSpeed = Client.Physics.MaxXSpeed
        const RunAcceleration = Client.GetRunAcceleration()
        const Friction = /*self.flag.grounded and self.frict_mult*/ 1 || 1

        //Get analogue state
        let Acceleration = new Vector3(0, 0, 0)
        let MovementAcceleration = 0
        let [HasControl, Turn, Magnitude] = Client.Input.Get()

        //X air drag
        // TODO: see if i can improve
        if (HasControl) {
            if (Client.Speed.X <= MaxXSpeed || Client.Ground.DotProduct <= 0.96) {
                if (Client.Speed.X > MaxXSpeed) {
                    Acceleration = Acceleration.add(new Vector3((Client.Speed.X - MaxXSpeed) * Client.Physics.AirResist.X, 0, 0))
                } else if (Client.Speed.X < 0) {
                    Acceleration = Acceleration.add(new Vector3(Client.Speed.X * Client.Physics.AirResist.X, 0, 0))
                }
            } else {
                Acceleration = Acceleration.add(new Vector3((Client.Speed.X - MaxXSpeed) * (Client.Physics.AirResist.X * 1.7), 0, 0))
            }
        } else {
            if (Client.Speed.X > Client.Physics.RunSpeed) {
                Acceleration = Acceleration.add(new Vector3(Client.Speed.X * Client.Physics.AirResist.X))
            } else if (Client.Speed.X > MaxXSpeed) {
                Acceleration = Acceleration.add(new Vector3((Client.Speed.X - MaxXSpeed) * Client.Physics.AirResist.X))
            } else if (Client.Speed.X < 0) {
                Acceleration = Acceleration.add(new Vector3(Client.Speed.X * Client.Physics.AirResist.X))
            }
        }

        //Y and Z air drag
        Client.Speed = Client.Speed.add(Client.Speed.mul(new Vector3(0, Client.Physics.AirResist.Y, Client.Physics.AirResist.Z)))

        //Movement
        if (HasControl) {
            //Get acceleration
            if (Client.Speed.X >= MaxXSpeed) {
                //Use lower acceleration if above max speed
                if (Client.Speed.X < MaxXSpeed || Client.Ground.DotProduct >= 0) {
                    MovementAcceleration = RunAcceleration * Magnitude * 0.4
                } else {
                    MovementAcceleration = RunAcceleration * Magnitude
                }
            } else {
                //Get acceleration, stopping at intervals based on analogue stick magnitude
                MovementAcceleration = 0

                if (Client.Speed.X >= Client.Physics.JogSpeed) {
                    if (Client.Speed.X >= Client.Physics.RunSpeed) {
                        if (Magnitude <= 0.9) {
                            MovementAcceleration = RunAcceleration * Magnitude * 0.3
                        } else {
                            MovementAcceleration = RunAcceleration * Magnitude
                        }
                    } else if (Magnitude <= 0.7) {
                        if (Client.Speed.X < Client.Physics.RunSpeed) {
                            MovementAcceleration = RunAcceleration * Magnitude
                        }
                    } else {
                        MovementAcceleration = RunAcceleration * Magnitude
                    }
                } else if (Magnitude <= 0.5) {
                    if (Client.Speed.X < (Client.Physics.JogSpeed + Client.Physics.RunSpeed) * 0.5) {
                        MovementAcceleration = RunAcceleration * Magnitude
                    }
                } else {
                    MovementAcceleration = RunAcceleration * Magnitude
                }
            }

            //Turning
            const AbsoluteTurn = math.abs(Turn)
            if (math.abs(Client.Speed.X) < 0.001 && AbsoluteTurn > math.rad(22.5)) {
                MovementAcceleration = 0
                PhysicsHandler.Turn(Client, Turn, IntertiaState.FULL_INERTIA)
            } else {
                if (Client.Speed.X < (Client.Physics.JogSpeed + Client.Physics.RunSpeed) * 0.5 || AbsoluteTurn <= math.rad(22.5)) {
                    if (Client.Speed.X < Client.Physics.JogSpeed || AbsoluteTurn >= math.rad(22.5)) {
                        if (Client.Speed.X < Client.Physics.DashSpeed || !Client.Ground.Grounded) {
                            if (Client.Speed.X >= Client.Physics.JogSpeed && Client.Speed.X <= Client.Physics.RushSpeed && AbsoluteTurn > math.rad(45)) {
                                MovementAcceleration *= 0.8
                            }
                            PhysicsHandler.Turn(Client, Turn, undefined)
                        } else {
                            PhysicsHandler.Turn(Client, Turn, IntertiaState.GROUND_NOFRICT)
                        }
                    } else {
                        PhysicsHandler.Turn(Client, Turn, IntertiaState.GROUND_NOFRICT)
                    }
                } else {
                    MovementAcceleration = Client.Physics.StandardDeceleration / Friction
                    PhysicsHandler.Turn(Client, Turn, undefined)
                }
            }
        } else {
            //Decelerate
            MovementAcceleration = PhysicsHandler.GetDecel(Client.Speed.X + Acceleration.X, Client.Physics.StandardDeceleration)
        }

        //Apply movement acceleration
        Acceleration = Acceleration.add(new Vector3(MovementAcceleration * Friction, 0, 0))

        //Apply acceleration
        Client.Speed = Client.Speed.add(Acceleration)
    },

    /**
     * Apply airborne acceleration, gravity calculations are separate
     * @param Client 
     */
    AccelerateAirborne: (Client: Client) => {
        //Get analogue state
        const [HasControl, Turn, Magnitude] = Client.Input.Get()

        //Air drag
        Client.Speed = Client.Speed.add(Client.Speed.mul(Client.GetAirResist()).div((1 + Client.Rail.RailTrick)))

        //Use lighter gravity if A is held or doing a rail trick
        if ((Client.Rail.RailTrick > 0) || (Client.Flags.JumpTimer > 0 && Client.Flags.BallEnabled && Client.Input.Button.Jump.Activated)) {
            Client.Flags.JumpTimer--
            Client.Speed = Client.Speed.add(new Vector3(0, Client.Physics.JumpHoldForce * 0.8 * (1 + Client.Rail.RailTrick / 2), 0))
        }

        //Get our acceleration
        const DoSkid = (Client.Speed.X <= Client.Physics.RunSpeed || math.abs(Turn) <= math.rad(135))
        if (DoSkid) {
            PhysicsHandler.Turn(Client, Turn)
        }
        const Acceleration =
            Client.Rail.RailTrick > 0 ?
                Client.Physics.AirAcceleration * (1 + Client.Rail.RailTrick / 2.5) :
                !HasControl ?
                    0 :
                    // Check for skid
                    DoSkid ?
                        math.abs(Turn) <= math.rad(22.5) ?
                            (
                                Client.Physics.AirAcceleration * Magnitude * (Client.Speed.Y >= 0 && 2 || 1)
                            ) : 0
                        // Air brake
                        : Client.Physics.AirDeceleration * Magnitude

        //Accelerate
        Client.Speed = Client.Speed.add(Vector3.xAxis.mul(Acceleration))
    },

    // Gravity
    ApplyGravity: (Client: Client) => {
        if (Client.IsScripted()) { return }

        const weight = Client.GetWeight()

        //Get cross product between our moving velocity and floor normal
        const FloorCrossSpeed = Client.Flags.LastUp.Cross(Client.ToGlobal(Client.Speed)) // TODO: replace with floor normal if needed
        let GravityAcceleration = Client.ToLocal(Client.Flags.Gravity.mul(weight))
        if (Client.Ground.DotProduct < 0.875) {
            if (Client.Ground.DotProduct >= 0.1 || math.abs(FloorCrossSpeed.Y) <= 0.6 || Client.Speed.X < 1.16) {
                if (Client.Ground.DotProduct >= -0.4 || Client.Speed.X <= 1.16) {
                    if (Client.Ground.DotProduct < -0.3 && Client.Speed.X > 1.16) {

                    } else if (Client.Ground.DotProduct < -0.1 && Client.Speed.X > 1.16) {

                    } else if (Client.Ground.DotProduct < 0.5 && math.abs(Client.Speed.X) < Client.Physics.RunSpeed) {
                        GravityAcceleration = GravityAcceleration.mul(new Vector3(4.225, 1, 4.225))
                    } else if (Client.Ground.DotProduct >= 0.7 || math.abs(Client.Speed.X) > Client.Physics.RunSpeed) {
                        if (Client.Ground.DotProduct >= 0.87 || Client.Physics.JogSpeed <= math.abs(Client.Speed.X)) {

                        } else {
                            GravityAcceleration = GravityAcceleration.mul(new Vector3(1, 1, 1.4))
                        }
                    } else {
                        GravityAcceleration = GravityAcceleration.mul(new Vector3(1, 1, 2))
                    }
                } else {

                }
            } else {
                GravityAcceleration = new Vector3(0, -weight, 0)
            }
        } else {
            GravityAcceleration = new Vector3(0, -weight, 0)
        }

        Client.Speed = Client.Speed.add(GravityAcceleration)
    },

    // Movement
    // TOOD: port https://github.com/SonicOnset/DigitalSwirl-Client/blob/master/ControlScript/Client/Movement.lua
    AlignToGravity: (Client: Client) => {
        if (Client.IsScripted()) { return }

        if (Client.Speed.Magnitude < Client.Physics.DashSpeed) {
            //Remember previous speed
            const prev_spd = Client.ToGlobal(Client.Speed)

            //Get next angle
            const from = Client.Angle.UpVector
            const to = Client.Flags.Gravity.Unit.mul(-1)
            const turn = VUtil.Angle(from, to)

            if (turn !== 0) {
                const max_turn = math.rad(11.25)
                const lim_turn = math.clamp(turn, -max_turn, max_turn)

                const next_ang = CFUtil.FromToRotation(from, to).mul(Client.Angle)

                Client.Angle = (Client.Angle.Lerp(next_ang, lim_turn / turn))
            }

            //Keep using previous speed
            Client.Speed = Client.ToLocal(prev_spd)
        }
    },
    /**
     * Slowdown function to emulate skidding
     * 
     * Used in `Skid` and `Spindash`
     * @param Client 
     */
    Skid: (Client: Client) => {
        const FrictionMultiplier = 1 // TODO: fricton mult

        const XFriction = Client.Physics.SkidFriction * FrictionMultiplier
        const ZFriction = Client.Physics.GroundFriction.Z * FrictionMultiplier

        Client.Speed = Client.Speed.add(Client.Speed.mul(Client.Physics.AirResist)).add(new Vector3(PhysicsHandler.GetDecel(Client.Speed.X, XFriction), 0, PhysicsHandler.GetDecel(Client.Speed.Z, ZFriction)))
    },

    /**
     * Replacement function for `AccelerateGrounded` and `AccelerateAirborne` for the `Roll` state, disables acceleration and keeps speed
     * @param Client 
     */
    ApplyInertia: (Client: Client) => {
        // TODO: see if i can seperate the gravity from this
        const Weight = Client.GetWeight()
        let Acceleration = Client.ToLocal(Client.Flags.Gravity.mul(Weight))

        if (Client.Ground.Grounded && Client.Speed.X > Client.Physics.RunSpeed && Client.Ground.DotProduct < 0) {
            // TODO: make dynamic
            Acceleration = Acceleration.mul(new Vector3(1, -8, 1))
        }

        if (Client.Flags.BallEnabled && Client.Ground.DotProduct < .98) {
            Acceleration = Acceleration.add(new Vector3(Client.Speed.X * -.0002, 0, 0))
        } else {
            Acceleration = Acceleration.add(new Vector3(Client.Speed.X * Client.Physics.AirResist.X, 0, 0))
        }

        Acceleration = Acceleration.add(new Vector3(0, Client.Speed.Y, Client.Speed.Z).mul(Client.Physics.AirResist.Z))

        Client.Speed = Client.Speed.add(Acceleration)
    },

    // Turning
    /**
     * Raw turning function used in the main Client.Turn function, will directly rotate the Clients Y axis
     * 
     * Do not use over Client.Turn unless you want to snap the angle!
     * @param Client 
     * @param Turn Amount in radians to turn
     */
    TurnRaw: (Client: Client, Turn: number) => {
        Client.Angle = Client.Angle.mul(CFrame.Angles(0, Turn, 0))
    },

    /**
     * Turning function, limits max angle to smooth out turns, use over `TurnRaw`
     * 
     * `IState` Options:
     * 
     *      undefined - Regular turning, variable max turn
     *      InertiaState.FULL_INERTIA - Max turning limited to 45, turns with 100% inertia
     *      InertiaState.GROUND_NOFRICT - Similar to undefined calculations, but assumes grounded & ignores low friction
     * 
     * @param Client 
     * @param Turn Amount in radians to turn
     * @param IState Inertia configs to match Digital Swirl
     */
    Turn: (Client: Client, Turn: number, IState?: IntertiaState) => {
        let MaxTurn = math.abs(Turn)
        const [HasControl] = Client.Input.Get()
        const PreviousSpeed = Client.ToGlobal(Client.Speed)

        /*
            UNDEFINED: Y
            FULL_INERTIA: YQ
            GROUND_NOFRICT: YS
        */
        if (IState === undefined) { // cannot do !IState?
            if (MaxTurn <= math.rad(45)) {
                if (MaxTurn <= math.rad(22.5)) {
                    MaxTurn /= 8
                } else {
                    MaxTurn /= 4
                }
            } else {
                MaxTurn = math.rad(11.25)
            }
        } else if (IState === IntertiaState.FULL_INERTIA) {
            MaxTurn = math.clamp(Turn, math.rad(-45), math.rad(45))
        } else if (IState === IntertiaState.GROUND_NOFRICT) {
            MaxTurn = math.rad(1.40625)
            if (Client.Speed.X > Client.Physics.DashSpeed) {
                MaxTurn = math.max(MaxTurn - (math.sqrt(((Client.Speed.X - Client.Physics.DashSpeed) * 0.0625)) * MaxTurn), 0)
            }
        }

        MaxTurn = math.abs(MaxTurn)

        //Turn
        PhysicsHandler.TurnRaw(Client, math.clamp(Turn, -MaxTurn, MaxTurn))

        if (IState === undefined) {
            if (Client.Ground.Grounded) {
                Client.Speed = Client.Speed.mul(.1).add(Client.ToLocal(PreviousSpeed).mul(.9))
            } else {
                let Inertia

                if (HasControl) {
                    if (Client.Ground.DotProduct <= .4) {
                        Inertia = .5
                    } else {
                        Inertia = .01
                    }
                } else {
                    Inertia = .95
                }

                /*
                if self.frict_mult < 1 then
                    inertia *= self.frict_mult
                end
                */

                Client.Speed = Client.Speed.mul(1 - Inertia).add(Client.ToLocal(PreviousSpeed).mul(Inertia))
            }
        } else if (IState === IntertiaState.FULL_INERTIA) {
            Client.Speed = Client.ToLocal(PreviousSpeed)
        } else if (IState === IntertiaState.GROUND_NOFRICT) {
            let Inertia
            if (Client.Ground.DotProduct <= .4) {
                Inertia = .5
            } else {
                Inertia = .01
            }

            Client.Speed = Client.Speed.mul(1 - Inertia).add(Client.ToLocal(PreviousSpeed).mul(Inertia))
        }

    },

    /**
     * Deceleration calculation
     * 
     * @param Speed Number to decelerate
     * @param Deceleration Maximum deceleration rate
     * @returns Applied deceleration speed
     */
    GetDecel(Speed: number, Deceleration: number) {
        if (Speed > 0) {
            return -math.min(Speed, -Deceleration)
        } else if (Speed < 0) {
            return math.min(-Speed, -Deceleration)
        }
        return 0
    }
}