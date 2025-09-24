export function Angle(From:Vector3, To:Vector3) {
    const Dot = (From.normalized).Dot(To.normalized)
	if (Dot >= 1) {
		return 0
    }
	else if (Dot <= -1) {
        return -math.pi
    }
	return math.acos(Dot)
}

export function Flatten(Vector:Vector3, Normal:Vector3) {
    const Dot = Vector.Dot(Normal.normalized)
	return Vector.sub((Normal.normalized).mul(Dot))
}

export function PlaneProject(Point:Vector3, Normal:Vector3) {
    const PointDot = Normal.normalized.Dot(Point)
	return $tuple(Point.sub(Normal.normalized.mul(PointDot)), PointDot)
}

export function SignedAngle(From:Vector3, To:Vector3, Up:Vector3) {
    const Right = (Up.normalized).Cross(From).normalized
    const FromToDot = (From.normalized).Dot(To.normalized)
    let RightDot = math.sign(Right.Dot(To.normalized))
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