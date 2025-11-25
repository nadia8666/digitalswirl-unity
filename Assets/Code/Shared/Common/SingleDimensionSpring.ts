/** 
 * Dampening is based on multiplying the value, not a real number
 * IsAngles expects euler (-180, 180) angles
*/
export class SingleDimensionSpring {
    constructor(public CurrentValue: number = 0,
        public TargetValue: number = 0,
        public Velocity: number = 0, public MagnitudeDivider: number = 95, public Strength: number = 1, public Dampening: number = 1, public IsAngles: boolean = false) {
    }

    public Update(DeltaTime: number, TargetValue: number, Set: boolean = false) {
        if (Set) {
            this.TargetValue = TargetValue
            this.CurrentValue = this.TargetValue
            
            return
        }
        this.TargetValue = TargetValue

        const Diff = this.TargetValue - this.CurrentValue
        const Direction = this.IsAngles ? (Diff + 540) % 360 - 180 : Diff
        const Magnitude = math.clamp01(math.abs(Direction) / this.MagnitudeDivider)
        this.Velocity += (this.Strength * Direction * Magnitude) * DeltaTime
        this.Velocity *= .97
        this.CurrentValue += this.Velocity
    }
}