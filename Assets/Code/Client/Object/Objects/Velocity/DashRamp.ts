import _OBJBase from "../Base";
import DSClient from "Code/Client/Client";

@AirshipComponentMenu("Object/DashRamp")
export default class _OBJDashRamp extends _OBJBase {
	public Velocity = 6;
	public LockTime = 0;

	override OnTouch(Client: DSClient) {
		Client.ResetObjectState();

		Client.Speed = Client.Speed.WithX(this.Velocity);

		Client.Sound.Play("Object/DashRamp/Activate.mp3");

		Client.Position = this.Collider.transform.position;
		Client.Angle = this.Collider.transform.rotation;

		Client.Flags.LockTimer = math.ceil(this.LockTime * 60);

		Client.State.Current = Client.State.States.Grounded;
		Client.Ground.Grounded = true;

		this.Debounce = 6;
	}
}
