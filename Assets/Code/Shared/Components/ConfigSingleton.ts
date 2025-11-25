import Character from "./CharacterSingleton"

@AirshipComponentMenu("Framework/Config")
export default class Config extends AirshipSingleton {
    // Animation
    public RigAnimationTilt: AnimationCurve
    public HeadTilt: AnimationCurve
    public EyeTilt: AnimationCurve

    // UI
    public ReticleMaxDistance: number = 100
    public ReticleDistanceCurve: AnimationCurve
    public ReticleTimeMax: number = 30
    public ReticleRotationSpeed: number = 6

    // Framework
    public GameSpeed: number = 1
    public Tickrate: number = 60
    public CollisionLayer: string = "GameLayer0"
    public ObjectLayer: string = "GameLayer1"
    public RailLayer: string = "GameLayer2"

    // Character
    public Character: Character 

    public Masks() {
        return {
            CollisionLayer: GetLayer(this.CollisionLayer),
            ObjectLayer: GetLayer(this.ObjectLayer),
            RailLayer: GetLayer(this.RailLayer)
        }
    }
}

const Masks = new Map<string, number>()
function GetLayer(Name: string) {
    const Mask = Masks.get(Name)

    if (!Mask) {
        Masks.set(Name, LayerMask.GetMask(Name))
        return Masks.get(Name)!
    }

    return Mask
}

let RegisteredConfig: Config | undefined
export function Constants() {
    const Conf = RegisteredConfig

    if (Conf === undefined) {
        RegisteredConfig = Config.Get()

        return RegisteredConfig
    }

    return Conf
}