import { Airship } from "@Easy/Core/Shared/Airship";

export default class SettingsSingleton extends AirshipSingleton {
	override Start() {
		Airship.Settings.AddSlider("SFX Volume", 0.4, 0, 1, 0.01);
		Airship.Settings.ObserveSlider("SFX Volume", (Volume) => {
			Settings.SFXVolume = Volume;
		});

		Airship.Settings.AddSlider("Music Volume", 0.25, 0, 1, 0.01);
		Airship.Settings.ObserveSlider("Music Volume", (Volume) => {
			Settings.MusicVolume = Volume;
		});

		Airship.Settings.AddSlider("Mouse Camera Sens.", 1, 0, 3, 0.01);
		Airship.Settings.ObserveSlider("Mouse Camera Sens.", (Sens) => {
			Settings.CameraSensitivityMouse = Sens;
		});

		Airship.Settings.AddSlider("Controller Camera Sens.", 1, 0, 3, 0.01);
		Airship.Settings.ObserveSlider("Controller Camera Sens.", (Sens) => {
			Settings.CameraSensitivityController = Sens;
		});
	}
}

export const Settings = {
	SFXVolume: 0,
	MusicVolume: 0,

	CameraSensitivityMouse: 0,
	CameraSensitivityController: 0,
};
