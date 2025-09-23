import * as VUtil from "./vutil"

export function FromToRotation(from: Vector3, to: Vector3) {
    //Get our axis and angle
    const axis = from.Cross(to)
    const angle = VUtil.Angle(from, to)

    //Create matrix from axis and angle
    if (angle <= -math.pi) {
        return CFrame.fromAxisAngle(new Vector3(0, 0, 1), math.pi)
    } else if (axis.Magnitude !== 0) {
        return CFrame.fromAxisAngle(axis, angle)
    } else {
        return CFrame.identity
    }
}