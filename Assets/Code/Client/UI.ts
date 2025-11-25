import { Constants } from "Code/Shared/Components/ConfigSingleton"
import { SoundController } from "./Draw/Sound"

@AirshipComponentMenu("Framework/UI")
export default class UI extends AirshipSingleton {
    @Header("Main")
    @SerializeField() private Camera: Camera

    @Header("HUD")
    @SerializeField() private Gem: Image
    @SerializeField() private RingsText: TMP_Text
    @SerializeField() private ScoreText: TMP_Text
    @SerializeField() private TimeText: TMP_Text

    @NonSerialized() public PlayerRings = 0
    @NonSerialized() public PlayerTime = 0
    @NonSerialized() public PlayerScore = 0

    private UpdatePlayerValues() {
        this.TimeText.text = this.FormatTime(this.PlayerTime)
        this.RingsText.text = this.RepZero(this.PlayerRings, 3)
        this.ScoreText.text = this.RepZero(this.PlayerScore, 6)
    }

    @Header("Reticle")
    @SerializeField() private Reticle: RectTransform

    private PlayerHomingTarget: Transform | undefined
    private ReticleTime: number = 0

    private UpdateHomingTarget(DeltaTime: number) {
        if (!this.PlayerHomingTarget) return

        const Position = this.Camera.WorldToScreenPoint(this.PlayerHomingTarget.position, MonoOrStereoscopicEye.Mono)
        this.Reticle.position = Position.WithZ(0)

        const Config = Constants()
        this.ReticleTime += DeltaTime * Config.Tickrate

        this.Reticle.sizeDelta = new Vector2(this.Reticle.sizeDelta.x, Config.ReticleMaxDistance * Config.ReticleDistanceCurve.Evaluate(math.clamp01(this.ReticleTime/Config.ReticleTimeMax)))
        this.Reticle.rotation = Quaternion.Euler(0, 0, this.ReticleTime * Config.ReticleRotationSpeed)
    }

    public SetHomingTarget(Target: Transform | undefined) {
        if (this.PlayerHomingTarget !== Target) {
            this.PlayerHomingTarget = Target
            this.Reticle.gameObject.SetActive(Target !== undefined ? true : false)
            this.ReticleTime = 0

            if (this.CurrentSound && Target !== undefined)
                this.CurrentSound.Play("UI/HomingReticleSXSG.wav") // TODO: settings HomingReticleUnleashed.wav
        }
    }

    @Header("Misc")
    public CurrentSound: SoundController|undefined

    // Main
    public Start() {
        this.Reticle.gameObject.SetActive(false)
    }

    public LateUpdate(DeltaTime: number) {
        this.UpdatePlayerValues()
        this.UpdateHomingTarget(DeltaTime)
    }

    // Utility
    public FormatTime(Time: number) {
        const Minutes = math.floor((Time/60)%60)
        const Seconds = math.floor(Time%60)
        const MS = math.floor((Time*1000)%100)

        return `${this.RepZero(Minutes, 2)}:${this.RepZero(Seconds, 2)}.${this.RepZero(MS, 2)}`
    }

    public RepZero(Amount: number, Zeroes: number) {
        const Length = `${Amount}`.size()

        return `${string.rep("0", math.max(Zeroes-Length, 0))}${Amount}`.sub(0, Zeroes)
    }
}