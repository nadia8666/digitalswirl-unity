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

            Debug: new ButtonState([Key.Digit1])
        }

        this.PlatformContext = "PC"
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
        let PCStickX = (Keyboard.IsKeyDown(Key.D) && 1 || 0) - (Keyboard.IsKeyDown(Key.A) && 1 || 0)
        let PCStickY = (Keyboard.IsKeyDown(Key.S) && 1 || 0) - (Keyboard.IsKeyDown(Key.W) && 1 || 0)

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
        if (this.Client.Flags.LockTimer > 0 || this.Stick.magnitude <= 0) return 0

        //Get character vectors
        const TargetUp = Vector3.up // TODO: camera chagne
        const Look = this.Client.Angle.mul(Vector3.forward)
        const Up = this.Client.Angle.mul(Vector3.up)

        //Get camera angle, aligned to our target up vector
        let [CameraLook] = VUtil.PlaneProject(this.Client.Camera.Transform.forward, TargetUp)
        if (CameraLook.magnitude !== 0) {
            CameraLook = CameraLook.normalized
        } else {
            CameraLook = Look
        }

        //Get move vector in world space, aligned to our target up vector
        let CameraMove = Quaternion.Euler(0, math.deg(math.atan2(this.Client.Input.Stick.x, -this.Client.Input.Stick.y)), 0).mul(CameraLook)

        //Update last up
        if (TargetUp.Dot(Up) >= -0.999) {
            this.Client.Flags.LastUp = Up
        }

        //Get final rotation and move vector
        const FinalRot = Quaternion.FromToRotation(TargetUp, this.Client.Flags.LastUp)

        let [FinalLook] = VUtil.PlaneProject(FinalRot.mul(CameraMove), Up)
        if (FinalLook.magnitude !== 0) {
            FinalLook = FinalLook.normalized
        } else {
            FinalLook = Look
        }

        //Get turn amount
        const Turn = VUtil.SignedAngle(Look, FinalLook, Up)
        this.Client.Animation.Turn = Turn
        return Turn
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