import { Airship } from "@Easy/Core/Shared/Airship"

export default class SettingsSingleton extends AirshipSingleton {
    override Start() {
        Airship.Settings.AddSlider("SFX Volume", .4, 0, 1, .01)
        Airship.Settings.ObserveSlider("SFX Volume", (Volume) => {
            Settings.SFXVolume = Volume
        })

        Airship.Settings.AddSlider("Music Volume", .25, 0, 1, .01)
        Airship.Settings.ObserveSlider("Music Volume", (Volume) => {
            Settings.MusicVolume = Volume
        })

        Airship.Settings.AddSlider("Additional Camera Sens.", 1, 0, 3, .01)
        Airship.Settings.ObserveSlider("Additional Camera Sens.", (Sens) => {
            Settings.CameraSensitivity = Sens
        })
    }
}

export const Settings = {
    SFXVolume: 0,
    MusicVolume: 0,

    CameraSensitivity: 0,
}