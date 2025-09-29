import { Asset } from "@Easy/Core/Shared/Asset";
import { StateList } from "Code/Client/States";
import Client from "../Client";
import SoundDataComponent from "Code/Shared/Components/SoundDataComponent";

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
    Target?: GameObject
}

export class SoundController {
    public Client: Client
    public Assets = []
    public Registry: GameObject[] = []

    constructor(Client: Client) {
        this.Client = Client
    }

    public Play(Path: string, Config: PlayConfig = {}): GameObject {
        const SoundContainer = Instantiate(Asset.LoadAsset("Assets/Resources/Empty.prefab"))
        SoundContainer.transform.SetParent(this.Client.gameObject.transform)
        SoundContainer.transform.localPosition = Vector3.zero

        const Audio = SoundContainer.AddComponent<AudioSource>()
        Audio.clip = Asset.LoadAsset(`Assets/Resources/Sounds/${Path}`)

        const Data = SoundContainer.AddAirshipComponent<SoundDataComponent>()
        Data.State = Config.BoundState
        Data.Class = Audio.clip.name

        if (!Config.MultiChannel) {
            for (const [Index, Target] of pairs(this.Registry)) {
                const Data = Target.GetAirshipComponent<SoundDataComponent>()

                if (Data && Data.Class === Audio.clip.name) {
                    Destroy(Target)
                    this.Registry[Index - 1] = undefined as unknown as GameObject
                }
            }
        }

        Audio.Play()

        if (!Audio.loop) {
            Destroy(SoundContainer, Audio.clip.length)
            task.delay(math.max(Audio.clip.length - .15, 0), () => {
                this.Registry.find((Object, Index) => {
                    if (Object === SoundContainer) {

                        this.Registry[Index] = undefined as unknown as GameObject
                        
                        return true
                    }
                })
            })
        }

        this.Registry.push(SoundContainer)

        return SoundContainer
    }

    public Stop(Path: string, Config: StopConfig = {}) {
        const Target = Config.Target
        const Clip = Asset.LoadAsset(`Assets/Resources/Sounds/${Path}`) as AudioClip

        if (Target) {
            for (const [Index, Sound] of pairs(this.Registry)) {
                if (Sound === Target) {
                    Destroy(Sound)

                    this.Registry[Index - 1] = undefined as unknown as GameObject
                }
            }
        } else {
            for (const [Index, Sound] of pairs(this.Registry)) {
                const Data = Sound.GetAirshipComponent<SoundDataComponent>()

                if (Data && Data.Class === Clip.name) {
                    Destroy(Sound)

                    this.Registry[Index - 1] = undefined as unknown as GameObject
                }
            }
        }
    }

    public Destroy() {
        for (const [Index, Sound] of pairs(this.Registry)) {
            Destroy(Sound)
        }

        this.Registry.clear()
    }

    public Update(Current: string) {
        for (const [Index, Sound] of pairs(this.Registry)) {
            const Data = Sound.GetAirshipComponent<SoundDataComponent>()

            if (Data) {
                if (Data.State && Data.State !== Current) {
                    Destroy(Sound)
                    this.Registry[Index - 1] = undefined as unknown as GameObject
                }
            } else {
                Destroy(Sound)
            }

        }
    }
}