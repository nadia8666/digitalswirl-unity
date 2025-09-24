export class CFrame {  
    public readonly Position: Vector3
    public readonly Rotation: Quaternion

    constructor(Position: Vector3 = Vector3.zero, Rotation: Quaternion = Quaternion.identity) {
        this.Position = Position
        this.Rotation = Rotation
    }

    public static identity = new CFrame()
    public static FromTransform(Transform: Transform) {
        return new CFrame(Transform.position, Transform.rotation)
    }
    public static FromQuaternion(Quaternion: Quaternion) {
        return new CFrame(Vector3.zero, Quaternion)
    }

    public mul(Other: CFrame) {
        const Position = this.Position.add(Other.Position)
        const Rotation = this.Rotation.mul(Other.Rotation)

        return new CFrame(Position, Rotation)
    }
    
    public add(Other: Vector3) {
        return new CFrame(this.Position.add(Other), this.Rotation)
    }

    public sub(Other: Vector3) {
        return new CFrame(this.Position.sub(Other), this.Rotation)
    }

    public Lerp(Other: CFrame, Alpha: number) {
        return new CFrame(this.Position.Lerp(Other.Position, Alpha), Quaternion.Slerp(this.Rotation, Other.Rotation, Alpha))
    }
}