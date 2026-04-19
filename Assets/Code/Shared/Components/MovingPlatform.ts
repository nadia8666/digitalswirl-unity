import { Constants } from "./ConfigSingleton";

export default class MovingPlatformComponent extends AirshipBehaviour {
	@Header("Translation")
	public TranslationAxis: Vector3 = Vector3.zero;

	@Header("Rotation")
	public RotationAxis: Vector3 = Vector3.zero;

	@Header("Sine")
	public SineAxisTranslation: Vector3 = Vector3.zero;
	public SineAxisRotation: Vector3 = Vector3.zero;
	public SineMultiplier: number = 1;

	private Index: number = -1;
	private Time: number = 0;

	private OriginalPosition = this.transform.position;
	private OriginalRotation = this.transform.rotation.eulerAngles;

	public OnEnable() {
		this.Index = MovingPlatforms.size() + 1;
		MovingPlatforms[this.Index - 1] = this;
	}

	public OnDisable() {
		if (this.Index === -1) return;

		MovingPlatforms[this.Index - 1] = undefined as unknown as typeof this;
		this.Index = -1;
	}

	public ClientHookedUpdate() {
		this.Time += 1 / Constants().Tickrate;
		const SineValue = math.sin(this.Time * this.SineMultiplier);
		let [NextPos, NextRot] = [this.transform.position, this.transform.rotation.eulerAngles];

		if (this.SineAxisTranslation.magnitude > 0) {
			NextPos = this.OriginalPosition.add(this.TranslationAxis.mul(this.SineAxisTranslation).mul(SineValue));
		} else {
			NextPos = NextPos.add(this.TranslationAxis);
		}

		if (this.SineAxisRotation.magnitude > 0) {
			NextRot = this.OriginalRotation.add(this.RotationAxis.mul(this.SineAxisRotation).mul(SineValue));
		} else {
			const Target = NextRot.add(this.RotationAxis);
			NextRot = new Vector3(((Target.x + 180) % 360) - 180, ((Target.y + 180) % 360) - 180, ((Target.z + 180) % 360) - 180);
		}

		this.transform.position = NextPos;
		this.transform.rotation = Quaternion.Euler(NextRot.x, NextRot.y, NextRot.z);
	}
}

export const MovingPlatforms = new Array<MovingPlatformComponent>();
