export function Angle(From:Vector3, To:Vector3) {
    const Dot = (From.Unit).Dot(To.Unit)
	if (Dot >= 1) {
		return 0
    }
	else if (Dot <= -1) {
        return -math.pi
    }
	return math.acos(Dot)
}

export function Flatten(Vector:Vector3, Normal:Vector3) {
    const Dot = Vector.Dot(Normal.Unit)
	return Vector.sub((Normal.Unit).mul(Dot))
}

export function PlaneProject(Point:Vector3, Normal:Vector3) {
    const PointDot = Normal.Unit.Dot(Point)
	return $tuple(Point.sub(Normal.Unit.mul(PointDot)), PointDot)
}

export function SignedAngle(From:Vector3, To:Vector3, Up:Vector3) {
    const Right = (Up.Unit).Cross(From).Unit
    const FromToDot = (From.Unit).Dot(To.Unit)
    let RightDot = math.sign(Right.Dot(To.Unit))
    if (RightDot === 0) {
        RightDot = 1
    }
    if (FromToDot >= 1) {
        return 0
    } else if (FromToDot <= -1) {
        return -math.pi * RightDot
    }
    return math.acos(FromToDot) * RightDot
}