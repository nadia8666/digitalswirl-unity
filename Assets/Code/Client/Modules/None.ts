import DSClient from "Code/Client/Client";
import { SrcState } from "./State";

/**
 * State which does not apply any collision or physics objects
 *
 * @class
 * @augments SrcState
 */
export class StateNone extends SrcState {
	constructor() {
		super();
	}

	protected CheckInput(Client: DSClient) {
		return true;
	}

	protected BeforeUpdateHook(Client: DSClient) {
		return true;
	}
}
