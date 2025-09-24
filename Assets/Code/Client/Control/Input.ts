import { Keyboard } from "@Easy/Core/Shared/UserInput";
import Client from "../Client";
import { ButtonState } from "./ButtonState";
import * as VUtil from "Code/Shared/Common/Utility/VUtil";

type ButtonUnion = ExtractKeys<Input["Button"], ButtonState>

/**
 * @class
 */
export class Input {
    public Button
    public PlatformContext: string
    public ControllerContext: String
    public Stick
    private Client: Client

    constructor(Client: Client) {
        this.Client = Client
        this.Button = {
            Jump: new ButtonState([Key.Space]),
            Spindash: new ButtonState([Key.E, Key.LeftShift]),
            Roll: new ButtonState([Key.E, Key.LeftShift]),
            Bounce: new ButtonState([Key.E, Key.LeftShift]),
            AirKick: new ButtonState([Key.R]),
        }

        this.PlatformContext = "PC" // assume pc by default
        this.ControllerContext = "Xbox"
        this.Stick = Vector2.zero
    }

    /**
     * Translates a KeyCode to a list of all binded `Input.Button`s
     * @param Key Key
     * @returns List of all k
     */
    public KeyCodeToButton(Key: Key) {
        const List: ButtonUnion[] = []
        for (const [Index, Button] of pairs(this.Button)) {
            const Target = Button.KeyCodes.find(Object => Object === Key)
            if (Target) {
                List.push(Index)
            }
        }

        return List
    }

    public GetInputState() {
        const KeyboardState = new Set<Key>()

        //const ControllerState = UserInputService.GetGamepadState(Enum.UserInputType.Gamepad1)
        //const MobileState: InputObject[] = [] // TODO: automatically create mobile buttons and match them to keycodes

        for (const [ID, State] of pairs(this.Button)) {
            for (const [_, Button] of pairs(State.KeyCodes)) {
                if (Keyboard.IsKeyDown(Button)) {
                    KeyboardState.add(Button)
                }
            }
        }

        return $tuple(KeyboardState)//, ControllerState, MobileState)
    }

    /**
     * Update input
     */
    public Update() {
        const [KeyboardState] = this.GetInputState()

        let KeyList = new Set<string>()

        KeyboardState.forEach((Key) => {
            const List = this.KeyCodeToButton(Key)
            List.forEach((Key) => {
                if (Key) {
                    if (!KeyList.has(Key)) {
                        KeyList.add(Key)

                        this.Button[Key].Update(true)
                    }
                }
            })
        })

        // Update unpressed keys
        for (const [Index, Button] of pairs(this.Button)) {
            if (Button.Activated && !KeyList.has(Index)) {
                Button.Update(false)
            }
        }

        // Stick
        let PCStickX = 0
        let PCStickY = 0

        PCStickX += Keyboard.IsKeyDown(Key.A) && -1 || 0
        PCStickX += Keyboard.IsKeyDown(Key.D) && 1 || 0
        PCStickY -= Keyboard.IsKeyDown(Key.W) && 1 || 0
        PCStickY -= Keyboard.IsKeyDown(Key.S) && -1 || 0


        this.Stick = new Vector2(PCStickX, PCStickY)
        if (this.Stick.magnitude > 1) { this.Stick = this.Stick.normalized }

        // TODO: mobile stick

        // TODO: Update platform & controller context
    }

    public PrepareReset() {
        for (const [_, Key] of pairs(this.Button)) {
            Key.CanBeUpdated = true
        }
    }

    public InputLocked() {
        return this.Client.Flags.DirectVelocity && this.Client.Flags.LockTimer > 0
    }

    /**
     * Convert input angle to turn value
     * @returns Current turn value
     */
    public GetTurn() {
        if (this.Client.Flags.LockTimer > 0) {
            return 0
        }

        if (this.Stick.magnitude <= 0) { return 0 }

        //Get character vectors
        const tgt_up = Vector3.up // TODO: camera chagne
        const look = this.Client.Angle.mul(Vector3.forward)
        const up = this.Client.Angle.mul(Vector3.up)

        //Get camera angle, aligned to our target up vector
        let [cam_look] = VUtil.PlaneProject(this.Client.Camera.Transform.forward, tgt_up)
        if (cam_look.magnitude !== 0) {
            cam_look = cam_look.normalized
        } else {
            cam_look = look
        }

        //Get move vector in world space, aligned to our target up vector
        print(math.deg(math.atan2(-this.Client.Input.Stick.x, -this.Client.Input.Stick.y)))
        let cam_move = Quaternion.Euler(0, math.deg(math.atan2(this.Client.Input.Stick.x, -this.Client.Input.Stick.y)), 0).mul(cam_look)

        //Update last up
        if (tgt_up.Dot(up) >= -0.999) {
            this.Client.Flags.LastUp = up
        }

        //Get final rotation and move vector
        const final_rotation = Quaternion.FromToRotation(tgt_up, this.Client.Flags.LastUp)

        let [final_move] = VUtil.PlaneProject(final_rotation.mul(cam_move), up)
        if (final_move.magnitude !== 0) {
            final_move = final_move.normalized
        } else {
            final_move = look
        }

        //Get turn amount
        const turn = VUtil.SignedAngle(look, final_move, up)
        return turn
    }

    /**
     * Get all input information
     * @returns Tuple: {HasControl, ClientTurn, StickMagnitude}
     */
    public Get() {
        // has_control, last_turn, stick_mag
        // TODO: has_control
        return $tuple(!this.InputLocked() && this.Stick.magnitude !== 0, this.GetTurn(), this.Stick.magnitude)
    }
}