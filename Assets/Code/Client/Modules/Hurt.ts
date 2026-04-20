import type DSClient from "Code/Client/Client";
import { PhysicsHandler } from "Code/Client/Physics/Physics";
import { CheckRail } from "./Rail";
import { SrcState } from "./State";

/**
 * @class
 * @augments SrcState
 */
export class StateHurt extends SrcState {
	protected CheckInput(Client: DSClient) {
		return CheckRail(Client);
	}

	protected BeforeUpdateHook(Client: DSClient) {
		PhysicsHandler.ApplyInertia(Client);
		PhysicsHandler.AlignToGravity(Client);
		Client.Ground.Grounded = false;
	}

	protected AfterUpdateHook(Client: DSClient) {
		if (Client.Ground.Grounded) {
			Client.State.Current = Client.State.States.Grounded;
			Client.Animation.Current = "Land";
			Client.Land();
			Client.Speed = Client.Speed.Lerp(Vector3.zero, math.abs(Client.Ground.DotProduct));
		} else if (Client.Flags.HurtTime > 0) {
			Client.Flags.HurtTime--;

			if (Client.Flags.HurtTime <= 0) {
				Client.State.Current = Client.State.States.Airborne;
				Client.Animation.Current = "Fall";
			}
		}
	}
}
