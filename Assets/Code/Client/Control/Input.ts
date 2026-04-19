import { Keyboard } from "@Easy/Core/Shared/UserInput";
import DSClient from "../Client";
import { ButtonState } from "./ButtonState";
import * as VUtil from "Code/Shared/Common/Utility/VUtil";
import { Game } from "@Easy/Core/Shared/Game";
import { Airship } from "@Easy/Core/Shared/Airship";

type ButtonUnion = ExtractKeys<DSInput["Button"], ButtonState>;

const ButtonHash = new Map<Key | KeyCode, ButtonUnion[]>();

export const ControllerMap = {
	ButtonA: KeyCode.JoystickButton0,
	ButtonB: KeyCode.JoystickButton1,
	ButtonX: KeyCode.JoystickButton2,
	ButtonY: KeyCode.JoystickButton3,

	LB: KeyCode.JoystickButton4,
	RB: KeyCode.JoystickButton5,
	Pause: KeyCode.JoystickButton6,
	Start: KeyCode.JoystickButton7,

	LStick: KeyCode.JoystickButton8,
	RStick: KeyCode.JoystickButton9,
};

/**
 * @class
 */
export class DSInput {
	public Button;
	public PlatformContext: "KBJS" | "Touch";
	public Stick;
	private Client: DSClient;

	constructor(Client: DSClient) {
		this.Client = Client;
		this.Button = {
			Jump: new ButtonState([Key.Space], [ControllerMap.ButtonA]),
			Spindash: new ButtonState([Key.E, Key.LeftShift], [ControllerMap.ButtonX, ControllerMap.ButtonB]),
			Roll: new ButtonState([Key.E, Key.LeftShift], [ControllerMap.ButtonX, ControllerMap.ButtonB]),
			Bounce: new ButtonState([Key.E, Key.LeftShift], [ControllerMap.ButtonX, ControllerMap.ButtonB]),

			Debug: new ButtonState([Key.Digit1], [ControllerMap.LB]),
		};

		this.PlatformContext = "KBJS";
		this.Stick = Vector2.zero;
	}

	/**
	 * Translates a KeyCode to a list of all binded `Input.Button`s
	 * @param Key Key
	 * @returns List of all k
	 */
	public KeyToButton(Key: Key | KeyCode) {
		let Hashed = ButtonHash.get(Key);

		if (!Hashed) {
			const List: ButtonUnion[] = [];
			for (const [Index, Button] of pairs(this.Button)) {
				if (Button.Keys.find((Object) => Object === Key)) {
					List.push(Index);
				}

				if (Button.KeyCodes.find((Object) => Object === Key)) {
					List.push(Index);
				}
			}

			Hashed = List;
			ButtonHash.set(Key, Hashed);
		}

		return Hashed;
	}

	public GetInputState() {
		const KeyState = new Set<Key | KeyCode>();

		for (const [ID, State] of pairs(this.Button)) {
			for (const [_, Button] of pairs(State.Keys)) {
				if (Keyboard.IsKeyDown(Button)) {
					KeyState.add(Button);
				}
			}

			for (const [_, Button] of pairs(State.KeyCodes)) {
				if (Input.GetKey(Button)) {
					KeyState.add(Button);
				}
			}
		}

		const KeyList = new Set<string>();
		for (const [Key] of pairs(KeyState)) {
			const List = this.KeyToButton(Key);
			List.forEach((Key) => {
				if (Key) {
					if (!KeyList.has(Key)) {
						KeyList.add(Key);

						this.Button[Key].Update(true);
					}
				}
			});
		}

		return KeyList;
	}

	/**
	 * Update input
	 */
	public Update() {
		const KeyList = this.GetInputState();

		// Update unpressed keys
		for (const [Index, Button] of pairs(this.Button)) {
			if (Button.Activated && !KeyList.has(Index)) {
				Button.Update(false);
			}
		}

		// Stop moving when in chat
		if (Airship.Chat.IsOpen()) return;

		// Stick
		if (this.PlatformContext === "KBJS") {
			// TOOD: once airship controller support is out reimplement this correctly
			this.Stick = Game.IsEditor()
				? new Vector2(Input.GetAxis("HorizontalKB"), Input.GetAxis("VerticalKB")).add(new Vector2(Input.GetAxis("HorizontalJS"), -Input.GetAxis("VerticalJS")))
				: new Vector2((Keyboard.IsKeyDown(Key.A) ? -1 : 0) + (Keyboard.IsKeyDown(Key.D) ? 1 : 0), (Keyboard.IsKeyDown(Key.W) ? -1 : 0) + (Keyboard.IsKeyDown(Key.S) ? 1 : 0));
		} else {
		}

		if (this.Stick.magnitude > 1) {
			this.Stick = this.Stick.normalized;
		}

		// TODO: mobile stick

		// TODO: Update platform & controller context
	}

	public PrepareReset() {
		for (const [_, Key] of pairs(this.Button)) {
			Key.CanBeUpdated = true;
		}
	}

	public InputLocked() {
		return this.Client.Flags.DirectVelocity && this.Client.Flags.LockTimer > 0;
	}

	/**
	 * Convert input angle to turn value
	 * @returns Current turn value
	 */
	public GetTurn() {
		if (this.Client.Flags.LockTimer > 0 || this.Stick.magnitude <= 0) return 0;

		//Get character vectors
		const TargetUp = Vector3.up; // TODO: camera chagne
		const Look = this.Client.Angle.mul(Vector3.forward);
		const Up = this.Client.Angle.mul(Vector3.up);

		//Get camera angle, aligned to our target up vector
		let [CameraLook] = VUtil.PlaneProject(this.Client.Camera.Transform.forward, TargetUp);
		if (CameraLook.magnitude !== 0) {
			CameraLook = CameraLook.normalized;
		} else {
			CameraLook = Look;
		}

		//Get move vector in world space, aligned to our target up vector
		let CameraMove = Quaternion.Euler(0, math.deg(math.atan2(this.Client.Input.Stick.x, -this.Client.Input.Stick.y)), 0).mul(CameraLook);

		//Update last up
		if (TargetUp.Dot(Up) >= -0.999) {
			this.Client.Flags.LastUp = Up;
		}

		//Get final rotation and move vector
		const FinalRot = Quaternion.FromToRotation(TargetUp, this.Client.Flags.LastUp);

		let [FinalLook] = VUtil.PlaneProject(FinalRot.mul(CameraMove), Up);
		if (FinalLook.magnitude !== 0) {
			FinalLook = FinalLook.normalized;
		} else {
			FinalLook = Look;
		}

		//Get turn amount
		const Turn = VUtil.SignedAngle(Look, FinalLook, Up);
		this.Client.Animation.Turn = Turn;
		return Turn;
	}

	/**
	 * Get all input information
	 * @returns Tuple: {HasControl, ClientTurn, StickMagnitude}
	 */
	public Get() {
		// has_control, last_turn, stick_mag
		// TODO: has_control
		return $tuple(!this.InputLocked() && this.Stick.magnitude !== 0, this.GetTurn(), this.Stick.magnitude);
	}
}
