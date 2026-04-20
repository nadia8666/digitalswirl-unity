import type DSClient from "Code/Client/Client";
import type { ValidAnimation } from "./Animations";
import { Constants } from "./Components/ConfigSingleton";

export function ToFloat3(Input: Vector3) {
	return new float3(Input.x, Input.y, Input.z);
}

export interface DrawInformation {
	Position: Vector3;
	Rotation: Quaternion;

	// Rail
	RailOffset: Vector3;
	RailBalance: number;

	// JumpBall
	JumpBall: boolean;
	AnimationRate: number;
	JumpBallHeight: number;
	JumpBallStretch: number;
	JumpBallSpeed: number;

	// SpindashBall
	SpindashBall: boolean;
	SpindashSpeed: number;

	// Animation
	Animation: ValidAnimation;
	AnimationSpeed: number;
	Speed: Vector3;
}

export function GetRenderInfo<T extends DSClient>(Client?: T) {
	const i = Client === undefined;
	const JumpBall = i ? false : Client.Flags.BallEnabled && Client.Animation.Current === "Roll";
	const SpindashBall = i ? false : Client.Flags.BallEnabled && Client.Animation.Current === "Spindash";
	const AnimationRate = i ? 0 : Client.Animation.GetRate();

	return {
		Speed: i ? Vector3.zero : Client.Speed,

		RailOffset: i ? Vector3.zero : Client.Rail.RailOffset,
		RailBalance: i ? 0 : Client.Rail.RailBalance,
		Position: i ? Vector3.zero : Client.RenderCFrame.Position,
		Rotation: i ? Quaternion.identity : Client.RenderCFrame.Rotation,
		JumpBall: JumpBall,
		SpindashBall: SpindashBall,

		AnimationRate: AnimationRate,
		JumpBallHeight: i ? 0 : Client.Ground.Grounded ? Client.Config.JumpBallHeightRoll : Client.Config.JumpBallHeightAir,
		JumpBallStretch: i ? 0 : Constants().JumpBallStretchCurve.Evaluate(Client.Flags.JumpStretchTimer / Client.Config.JumpStretchTimer) * Client.Config.JumpBallStretch,
		JumpBallSpeed: i ? 0 : Constants().JumpBallRotationSpeed.Evaluate(math.clamp01(AnimationRate / 20)),

		SpindashSpeed: i ? 0 : Constants().SpindashBallRotationSpeed.Evaluate(math.clamp01(Client.Flags.SpindashSpeed / 10) + 0.15),

		Animation: i ? "Idle" : Client.Animation.Current,
		AnimationSpeed: i ? 0 : Client.Animation.Speed,
	};
}
