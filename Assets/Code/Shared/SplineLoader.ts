export default class SplineLoader extends AirshipBehaviour {
    public SplineString: string
    public Spline: SplineContainer

    override Start() {
        const Splits = string.split(this.SplineString, "+")
        const Points: Vector3[] = []

        for (const [_, Vector] of pairs(Splits)) {
            if (!Vector.find(",")[0]) { continue }

            const Axis = string.split(Vector, ",") as [string,string,string]

            Points.push(new Vector3(tonumber(Axis[0]) as number, tonumber(Axis[1]) as number, tonumber(Axis[2]) as number))
        }

        const ToAdd = new Spline()
        for (const [_, Position] of pairs(Points)) {
            ToAdd.Add(new BezierKnot(new float3(Position.x, Position.y, Position.z)))
        }
        SplineUtility.AddSpline(this.Spline, ToAdd)
    }
}