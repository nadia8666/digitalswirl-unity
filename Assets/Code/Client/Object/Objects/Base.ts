import { Bin } from "@Easy/Core/Shared/Util/Bin";
import type DSClient from "Code/Client/Client";
import { RegisterObject } from "../ObjectController";

export default class _OBJBase extends AirshipBehaviour {
	@NonSerialized() public Collider = this.gameObject.GetComponent<BoxCollider>()!;
	@NonSerialized() public HomingTarget = false;
	@NonSerialized() public HomingWeight = 1;
	protected Connections = new Bin();
	protected Debounce = 0;
	public readonly meta = {
		AnimationLoader: false,
	};

	override Start() {
		if ($CLIENT) {
			this.InitObject();
		}
	}

	public OnStart() {}

	public InitObject() {
		this.OnStart();

		RegisterObject(this);
	}

	protected OnTick(_GetClient: () => DSClient) {
		if (this.Debounce > 0) {
			this.Debounce--;
		}
	}

	/**
	 * Client touched callback
	 * @param Client
	 */
	protected OnTouch(_Client: DSClient) {}

	/**
	 * .RenderStepped callback
	 * @param DeltaTime
	 */
	protected PreRender(_DeltaTime: number) {}

	protected OnRespawn() {}

	public Tick(GetClient: () => DSClient) {
		this.OnTick(GetClient);
	}

	public TouchClient(Client: DSClient) {
		if (this.Debounce > 0) {
			return;
		}

		this.OnTouch(Client);
	}

	public Draw(DeltaTime: number) {
		this.PreRender(DeltaTime);

		if (this.meta.AnimationLoader) {
			(
				this as unknown as {
					AnimationController: {
						Animate: (_: _OBJBase) => void;
					};
				}
			).AnimationController.Animate(this);
		}
	}

	public Respawn() {
		this.OnRespawn();
	}
}
