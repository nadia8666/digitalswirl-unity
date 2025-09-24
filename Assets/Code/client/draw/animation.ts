import Client from "../Client";

/**
 * @class
 */
export class Animation {
    public Current: string
    public Speed: number = 0
    private Last: string

    constructor(Client: Client) {
        this.Last = "Idle"
        this.Current = "Fall"
    }
}