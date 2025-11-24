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

    public static FromRotationBetweenVectors(Start: Vector3, End: Vector3): CFrame {
        const Startn = Start.normalized
        const Endn = End.normalized
        const Dot = Vector3.Dot(Startn, Endn)

        if (Dot >= 0.999999) {
            return CFrame.identity
        }

        if (Dot <= -0.999999) {
            let Axis = Vector3.Cross(Vector3.right, Startn)
            
            if (Axis.magnitude < 0.001) {
                Axis = Vector3.Cross(Vector3.up, Startn)
            }
            
            Axis = Axis.normalized

            return new CFrame(Vector3.zero, new Quaternion(Axis.x, Axis.y, Axis.z, 0))
        }

        const Axis = Vector3.Cross(Startn, Endn)
        const w = 1 + Dot

        return new CFrame(Vector3.zero, new Quaternion(Axis.x, Axis.y, Axis.z, w).normalized)
    }

    // Compose two cframes
    public mul<T extends CFrame | Vector3 | Quaternion>(Other: T): T extends CFrame ? CFrame : T extends Quaternion ? Quaternion : Vector3 {
        if (Other instanceof CFrame) {
            const Rotation = this.Rotation.mul(Other.Rotation)
            const Inverse = Quaternion.Inverse(this.Rotation)
            const Addition = this.Rotation.mul(new Quaternion(Other.Position.x, Other.Position.y, Other.Position.z, 0)).mul(Inverse)
            
            const Position = this.Position.add(new Vector3(Addition.x, Addition.y, Addition.z))
            return new CFrame(Position, Rotation) as T extends CFrame ? CFrame : T extends Quaternion ? Quaternion : Vector3
        } else if (typeOf(Other) === "Quaternion") {
            const Rotation = this.Rotation.mul(Other)
            
            return Rotation as T extends CFrame ? CFrame : T extends Quaternion ? Quaternion : Vector3
        } else
            return this.Position.add(this.Rotation.mul(Other as Vector3)) as T extends CFrame ? CFrame : T extends Quaternion ? Quaternion : Vector3
    }

    // Translate the cframe in world space
    public add(Other: Vector3) {
        return new CFrame(this.Position.add(Other), this.Rotation)
    }

    // Translate the cframe in world space
    public sub(Other: Vector3) {
        return new CFrame(this.Position.sub(Other), this.Rotation)
    }

    public Inverse() {
        const Rotation = Quaternion.Inverse(this.Rotation)
        return new CFrame(Rotation.mul(this.Position).mul(-1), Rotation)
    }

    public Lerp(Other: CFrame, Alpha: number) {
        return new CFrame(this.Position.Lerp(Other.Position, Alpha), Quaternion.Slerp(this.Rotation, Other.Rotation, Alpha))
    }

    public static Angles(rx: number, ry: number, rz: number) {
        const qx = Quaternion.AngleAxis(rx * (180 / math.pi), Vector3.right);
        const qy = Quaternion.AngleAxis(ry * (180 / math.pi), Vector3.up);
        const qz = Quaternion.AngleAxis(rz * (180 / math.pi), Vector3.forward);

        const rotation = qz.mul(qy).mul(qx);

        return new CFrame(Vector3.zero, rotation);
    }

    public ToOrientation() {
        const q = this.Rotation;
        
        const R10 = 2 * (q.x * q.y + q.z * q.w);
        const R11 = 1 - 2 * (q.x * q.x + q.z * q.z);
        const R12 = 2 * (q.y * q.z - q.x * q.w);

        const R02 = 2 * (q.x * q.z + q.y * q.w);
        const R22 = 1 - 2 * (q.x * q.x + q.y * q.y);

        const rx = math.asin(math.max(-1, math.min(1, -R12)));

        let ry: number, rz: number;

        if (math.abs(R12) > 0.99999) {
            rz = 0;
            const R01 = 2 * (q.x * q.y - q.z * q.w);
            const R00 = 1 - 2 * (q.y * q.y + q.z * q.z);
            ry = math.atan2(-R01, R00);
        } else {
            ry = math.atan2(R02, R22);
            rz = math.atan2(R10, R11);
        }

        return $tuple(rx, ry, rz);
    }
}

export function ToFloat3(Input: Vector3) {
    return new float3(Input.x, Input.y, Input.z)
}