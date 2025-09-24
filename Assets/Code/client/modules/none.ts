import Client from "Code/client/client"
import { SrcState } from "./state"

/**
 * State which does not apply any collision or physics objects
 * 
 * @class
 * @augments SrcState
 */
export class StateNone extends SrcState {
    constructor() {
        super()
    }

    protected CheckInput(Client: Client) {
        return true
    }

    protected BeforeUpdateHook(Client: Client) {
        return true
    }
}