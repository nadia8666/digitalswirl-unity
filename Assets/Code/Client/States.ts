import { StateSkid } from "./Modules/Skid"
import { StateSpindash, StateRoll } from "./Modules/Spindash"
import { StateAirborne } from "./Modules/Airborne"
import { StateGrounded } from "./Modules/Grounded"
import { StateNone } from "./Modules/None"
import { StateRail } from "./Modules/Rail"
import { StateAirKick } from "./Modules/Airkick"
import { StateHurt } from "./Modules/Hurt"
import { StateHoming } from "./Modules/Homing"

/**
 * List of all states for `StateMachine`
 * @class
 */
export class StateList {
    // Physics states
    public None = new StateNone
    public Airborne = new StateAirborne
    public Grounded = new StateGrounded
    public Hurt = new StateHurt

    // Move states
    public Spindash = new StateSpindash
    public Roll = new StateRoll
    public Skid = new StateSkid
    public Rail = new StateRail
    public AirKick = new StateAirKick
    public Homing = new StateHoming
}