import { CFrame } from "Code/Shared/Types";
import _OBJBase from "../Base";
import DSClient from "Code/Client/Client";
import { AnimatedObject, AnimateObject } from "../Implementables";

type Animations = "None" | "Activate";

@AirshipComponentMenu("Object/Spring")
export default class _OBJSpring extends _OBJBase implements AnimateObject<Animations> {
	public Animator: Animator;
	public Listener: AnimationEventListener;
	public AnimationController: AnimatedObject<Animations>;

	public Velocity = new Vector3(0, 2, 0);
	public Wide = false;
	public ForceAngle = false;
	public DirectVelocity = false;
	public LockTime = 0;

	override OnStart() {
		this.AnimationController = new AnimatedObject(this);

		this.HomingTarget = true;
		this.HomingWeight = 1;
	}

	override OnTouch(Client: DSClient) {
		Client.ResetObjectState();
		Client.EnterBall();

		Client.Speed = this.Velocity;

		Client.Sound.Play("Object/Spring/Activate.wav");

		if (this.Wide) {
			const Offset = this.gameObject.transform.InverseTransformPoint(Client.Position);

			Client.Position = this.gameObject.transform.TransformPoint(new Vector3(math.clamp(Offset.x, -this.Collider.size.x / 2, this.Collider.size.x / 2), 0, 0));
		} else {
			Client.Position = this.gameObject.transform.TransformPoint(this.Collider.center);
		}

		if (math.abs(this.gameObject.transform.up.Dot(Client.Flags.Gravity.normalized)) >= 0.95) {
			Client.Angle = CFrame.FromRotationBetweenVectors(Client.Angle.mul(Vector3.up), this.gameObject.transform.up).mul(Client.Angle);
		} else {
			Client.Angle = this.gameObject.transform.rotation;
		}

		Client.Flags.DirectVelocity = this.DirectVelocity;
		Client.Flags.LockTimer = math.ceil(this.LockTime * 60);
		Client.State.Current = Client.State.States.Airborne;
		Client.Animation.Current = "SpringStart";
		Client.Ground.Grounded = false;

		this.AnimationController.AnimationState = "Activate";

		this.Debounce = 6;
	}

	public UpdateAnimationState() {}

	public AnimationEnded() {
		this.AnimationController.AnimationState = "None";
	}
}
