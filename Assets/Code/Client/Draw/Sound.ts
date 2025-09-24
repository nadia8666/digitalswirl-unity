import { StateList } from "Code/Client/States";

type PlayConfig = {
    /**
     * If `undefined` or `false`, all other instances of this sound will be deleted
     */
    MultiChannel?: boolean,

    /**
     * Setting this to a `Vector3` will fade out audio depending on camera distance to `OriginPoint`, with volume 0 being `SoundRange`
     */
    OriginPoint?: Vector3,
    SoundRange?: number,

    BoundState?: keyof StateList
}

type StopConfig = {
    /**
     * Stopping a sound by name will stop all sounds under that name, use this to stop only a specific sound
     */
    Target?: string
}

export class SoundController {
    public Assets = []
    public Registry: string[] = []

    constructor() {

    }

    public Play(Path: string, Config?: PlayConfig): string {
        return "i"
    }

    public Stop(Name: string, Config?: StopConfig) {

    }

    public Destroy() {

    }

    public PathToSound(Path: string): undefined {
        return undefined
    }

    public Update(Current: string) {

    }
}