import DSClient from "Code/Client/Client";
import { PhysicsHandler } from "Code/Client/Physics/Physics";
import { CheckJump } from "./Jump";
import { CheckSkid } from "./Skid";
import { CheckSpindash } from "./Spindash";
import { SrcState } from "./State";
import { CheckRail } from "./Rail";
import { CFrame } from "Code/Shared/Types";

/**
 * @class
 * @augments SrcState
 */
export class StateGrounded extends SrcState {
	private LockedAnimations = new Set(["LandMoving", "Land", "JogStart"]);

	constructor() {
		super();
	}

	protected CheckInput(Client: DSClient) {
		return CheckJump(Client) || CheckSpindash(Client) || CheckSkid(Client) || CheckRail(Client);
	}

	protected BeforeUpdateHook(Client: DSClient) {
		if (Client.Speed.x === 0) {
			PhysicsHandler.RotateWithGravity(Client);
		}

		PhysicsHandler.ApplyGravity(Client);
		PhysicsHandler.AccelerateGrounded(Client);
	}

	protected AfterUpdateHook(Client: DSClient) {
		if (Client.Ground.Grounded) {
			const Slip = math.sqrt(1);
			const Acceleration = math.min(math.abs(Client.Speed.x) / Client.Config.CrashSpeed, 1);

			if (!this.LockedAnimations.has(Client.Animation.Current)) {
				Client.Animation.Current = (math.abs(Client.Speed.x) > 0.1 && "Run") || "Idle";
			}
			Client.Animation.Speed = (Client.Animation.Current === "Run" && math.lerp(Client.Speed.x / Slip + (1 - Slip) * 2, Client.Speed.x, Acceleration)) || 1;
			Client.Ground.UngroundedFrames = 0;
		} else {
			if (Client.Ground.UngroundedFrames >= Client.Config.CoyoteFrames) {
				Client.Animation.Current = "Fall";
				Client.State.Current = Client.State.States.Airborne;
			} else {
				Client.Ground.UngroundedFrames++;
			}
		}
	}
}
