@AirshipComponentMenu("Framework/Character")
export default class Character extends AirshipBehaviour {
    // Collision
    public Height = 5
    public Scale = .6 / 3
    public Radius = 3
    public PositionError = 2

    // Physics
    public Weight = .08

    // Speed
    public MaxXSpeed = 3
    public JogSpeed = .46
    public RunSpeed = 1.39
    public RushSpeed = 2.3
    public DashSpeed = 5.09
    public CrashSpeed = 3.7 // Used in Grounded's acceleration animation speed check
    public RollGetUp = 1.39 // Point at which the roll state should uncurl you

    // Acceleration
    public AirAcceleration = .031
    public RunAcceleration = .05
    public AirDeceleration = -0.17
    public StandardDeceleration = -.06
    public AirResist = new Vector3(-.008, -.01, -.4)

    // Jump
    public JumpInitialForce = 1.66
    public JumpHoldForce = .076
    public JumpTicks = 60

    // Friction
    public SkidFriction = -.18
    public GroundFriction = new Vector3(-.1, 0, -.6)

    // Moves
    public HomingForceDash = 5
    public HomingForceAttack = 5

    // Renderer
    public CameraOffset = new Vector3(0, 13, 0)
    public JumpBallHeightAir = 4
    public JumpBallHeightRoll = 3
    public JumpStretchTimer = 15
    public JumpBallStretch = .25
}