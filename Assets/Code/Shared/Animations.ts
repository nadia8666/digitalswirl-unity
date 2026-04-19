export type ValidAnimation = keyof typeof Animations;
export interface InferredAnimation {
	[Index: number]: {
		Name: string;
		Position?: number;
		Speed?: {
			Base: number;
			Increment: number;
			Absolute: boolean;
		};
	};
}

export interface AnimationData {
	EndAnimation?: ValidAnimation;
	Transitions?: {
		From?: {
			[Index: string]: number | undefined;
			All?: number;
		};
		To?: {
			[Index: string]: number | undefined;
			All?: number;
		};
	};
}

export type SetAnimation = InferredAnimation & AnimationData;

export const Animations = {
	Land: {
		[0]: { Name: "Land" },
		EndAnimation: "Idle",
	},
	LandMoving: {
		[0]: { Name: "LandMoving" },
		EndAnimation: "Run",
		Transitions: {
			To: {
				Run: 0,
			},
		},
	},
	Idle: {
		[0]: { Name: "Idle" },
	},
	HomingAttack: {
		[0]: { Name: "HomingAttack" },
		EndAnimation: "SpecialFall",
	},
	Idle2: {
		[0]: { Name: "Idle2" },
		EndAnimation: "Idle",
	},
	Roll: {
		[0]: { Name: "Roll", Speed: { Base: 0.25, Increment: 1 / 8, Absolute: true } },
		Transitions: {
			From: {
				All: 0,
			},
			To: {
				All: 0,
			},
		},
	},
	Spindash: {
		[0]: { Name: "Spindash" },
		Transitions: {
			From: {
				All: 0,
			},
			To: {
				All: 0,
			},
		},
	},
	Fall: {
		[0]: { Name: "Fall" },
	},
	SpecialFall: {
		[0]: { Name: "SpecialFall" },
	},
	Skid: {
		[0]: { Name: "Skid" },
		EndAnimation: "Idle",
	},
	SpringStart: {
		[0]: { Name: "SpringStart" },
		EndAnimation: "Spring",

		Transitions: {
			To: {
				Spring: 0,
			},
		},
	},
	Spring: {
		[0]: { Name: "Spring" },
		Transitions: {
			To: {
				Fall: 0.4,
				HomingAttack: 0.05,
			},
		},
	},
	Run: {
		[0]: {
			Name: "Jog",
			Position: 0,
			Speed: {
				Base: 1,
				Increment: 0.75,
				Absolute: false,
			},
		},
		[1]: {
			Name: "Run",
			Position: 4,
			Speed: {
				Base: 0,
				Increment: 1,
				Absolute: false,
			},
		},
		[2]: {
			Name: "Jet",
			Position: 6,
			Speed: {
				Base: 0,
				Increment: 1,
				Absolute: false,
			},
		},

		Transitions: {
			From: {
				JogStart: 0,
			},
		},
	},
	JogStart: {
		[0]: {
			Name: "JogStart",
		},
		EndAnimation: "Run",
	},
	Rail: {
		[0]: { Name: "Rail" },
	},
	RailCrouch: {
		[0]: { Name: "RailCrouch" },
	},
	RailLand: {
		[0]: { Name: "RailLand" },
	},
	RailBalance: {
		[0]: { Name: "RailBalance" },
	},
	RailSwitchLeft: {
		[0]: { Name: "RailSwitchLeft" },
	},
	RailSwitchRight: {
		[0]: { Name: "RailSwitchRight" },
	},
} as const satisfies {
	[Index: string]: {
		[Index: number]: {
			Name: string;
			Position?: number;
			Speed?: {
				Base: number;
				Increment: number;
				Absolute: boolean;
			};
		};
	} & {
		EndAnimation?: string;
		Transitions?: AnimationData["Transitions"];
	};
};

/*
		scale = .6,
		jump2_timer = 60,
		Position_error = 2,
		lim_h_spd = 16,
		lim_v_spd = 16,
		max_x_spd = 3,
		max_psh_spd = 0.6,
		jmp_y_spd = 1.66,
		nocon_spd = 3,
		slAnimationIDe_speed = 0.23,
		jog_speed = 0.46,
		run_speed = 1.39,
		rush_speed = 2.3,
		crash_speed = 3.7,
		dash_speed = 5.09,
		jmp_addit = 0.076,
		run_accel = 0.05,
		air_accel = 0.031,
		slow_down = -0.06,
		run_break = -0.18,
		air_break = -0.17,
		air_resist_air = -0.01,
		air_resist = -0.008,
		air_resist_y = -0.01,
		air_resist_z = -0.4,
		grd_frict = -0.1,
		grd_frict_z = -0.6,
		lim_frict = -0.2825,
		rat_bound = 0.3,
		rad = 3,
		height = 5,
		weight = 0.08,
		eyes_height = 7,
		center_height = 5.4,
		coyote_time = .15,
		air_max_speed = 6,
*/
