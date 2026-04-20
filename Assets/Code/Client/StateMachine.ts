import { Constants } from "Code/Shared/Components/ConfigSingleton";
import { MovingPlatforms } from "Code/Shared/Components/MovingPlatform";
import CFrame from "@inkyaker/CFrame/Code";
import type DSClient from "./Client";
import type { SrcState } from "./Modules/State";
import { StateList } from "./States";

/**
 * State machine
 * @class
 */
export class StateMachine {
	private Client: DSClient;
	public TickTimer: number;
	public States: StateList;
	public Current: SrcState;

	constructor(Client: DSClient) {
		this.States = new StateList();

		this.TickTimer = os.clock();
		this.Client = Client;
		this.Current = this.States.Airborne;
	}

	public GetStateName(State: SrcState) {
		for (const [Name, Target] of pairs(this.States)) {
			if (Target === State) {
				return Name;
			}
		}

		return "";
	}

	/**
	 * Internal method for ticking the current state
	 */
	private TickState() {
		this.Current.CheckMoves(this.Client);

		this.Current.Tick(this.Client);
	}

	/**
	 * Update the state machine, **only run this if you know what you're doing!**
	 */
	public Update(DeltaTime: number) {
		if (Constants().GameSpeed === 0) {
			this.Client.Input.PrepareReset();
			this.Client.Input.Update();

			return;
		}

		// Internal fixed update loop
		this.TickTimer = math.min(this.TickTimer + DeltaTime * (60 * Constants().GameSpeed), 10);
		while (this.TickTimer > 1) {
			// Timers
			if (this.Client.Flags.LockTimer > 0) this.Client.Flags.LockTimer--;

			if (this.Client.Flags.Invulnerability > 0) this.Client.Flags.Invulnerability--;

			if (this.Client.Flags.JumpTimer > 0) this.Client.Flags.JumpTimer--;

			if (this.Client.Flags.JumpStretchTimer > 0) this.Client.Flags.JumpStretchTimer--;

			// Main update
			this.Client.Input.Update();
			this.Client.Input.PrepareReset();

			// DEBUG
			if (this.Client.Input.Button.Debug.Pressed) {
				this.Client.Flags.Gravity = this.Client.Flags.Gravity.mul(-1);
				this.Client.Ground.Grounded = false;
				this.Client.SetAngle(this.Client.Angle.mul(Quaternion.Euler(0, 0, 180)));
				this.Client.Speed = this.Client.Speed.mul(new Vector3(1, -1, 0));
			}

			this.Client.Animation.Turn = 0;

			// Other objects
			for (const [_, Value] of pairs(MovingPlatforms)) {
				// TODO: consider changing to Object
				Value.ClientHookedUpdate();
			}

			// Game objects
			this.Client.Object.TickObjects();
			this.TickState();

			for (const [_, State] of pairs(this.States)) {
				State.Step(this.Client);
			}

			this.TickTimer--;

			this.Client.LastCFrame = this.Client.CurrentCFrame;
			this.Client.CurrentCFrame = new CFrame(this.Client.Position, this.Client.Angle);
		}
	}
}
