import DSClient from "Code/Client/Client"
import { RunCollision } from "Code/Client/Physics/Collision"
import { Rail } from "./Rail"

/**
 * State base type
 * @class
 */
export class SrcState {
    /**
     * @constructor
     */
    constructor() { }

    /**
     * Public abstracted method for state input checking, executes before State.Tick
     * 
     * Follows same rules as State.CheckInput
     * @param Client
     */
    public CheckMoves(Client: DSClient) {
        // Default input checking code

        // Per state code
        this.CheckInput(Client)
    }

    /**
     * Public abstracted method for updating player via BeforeUpdateHook and AfterUpdateHook
     * @param Client Client
     */
    public Tick(Client: DSClient) {
        // Pre update
        if (this.BeforeUpdateHook(Client) !== undefined) { return }

        // Tick global code in every state
        RunCollision(Client)

        // Account for object state changes
        if (Client.State.Current === this) {
            this.AfterUpdateHook(Client)
        } else {
            Client.State.Current.AfterUpdateHook(Client)
        }
    }

    /**
     * Specialized function designed for per-state cooldown management, runs every tick post state update
     * @see {@link Rail}
     * @param Client 
     */
    public Step(Client: DSClient) {
        this.OnStep(Client)
    }

    /**
     * Override method for state input checking
     * 
     * States can be changed in this method, and the new state will be Ticked
     * @param Client Client
     */
    protected CheckInput(Client: DSClient) {
    }

    /**
     * Override method for state update execution
     * 
     * Runs before the global update (Collision)
     * @param Client Client
     * @returns {true|undefined} If returned true will cancel the tick, skipping Collision, AfterUpdateHook, and Animate
     */
    protected BeforeUpdateHook(Client: DSClient): boolean | undefined | void {
    }

    /**
     * Override method for state update execution
     * 
     * Runs after the global update (Collision) and BeforeUpdateHook
     * @param Client Client
     */
    protected AfterUpdateHook(Client: DSClient) {
    }

    protected OnStep(Client: DSClient) {
    }
}