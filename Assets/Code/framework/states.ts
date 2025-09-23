import { StateSkid } from "./modules/skid"
import { StateSpindash, StateRoll } from "./modules/spindash"
import { StateAirborne } from "./modules/airborne"
import { StateGrounded } from "./modules/grounded"
import { StateNone } from "./modules/none"
import { StateRail } from "./modules/rail"
import { AirKick } from "./modules/airkick"
import { StateHurt } from "./modules/hurt"
import { SrcState } from "./modules/state"

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
    public AirKick = new AirKick
}