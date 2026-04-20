import { Game } from "@Easy/Core/Shared/Game";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import type { DrawInformation } from "Code/Shared/Types";
import type { DualLink } from "@inkyaker/DualLink/Code";
import type DSClient from "./Client";
import { Animation } from "./Draw/Animation";
import { Renderer } from "./Draw/Renderer";
import Framework from "./Framework";

export default class ClientReplicator extends AirshipBehaviour {
	public Connections = new Bin();
	public Client: DSClient;
	public Net: NetworkIdentity;

	public Position: Vector3;
	public Rotation: Quaternion;

	@NonSerialized() public Draw: Renderer;
	@NonSerialized() public Animation: Animation;
	@NonSerialized() public IsHost: boolean;

	private Link: DualLink<DrawInformation>;

	override Start() {
		this.IsHost = this.Client.Player === Game.localPlayer;
		this.Link = Framework.Get().Links.get(this.Client.Player)!;

		if (!this.IsHost) {
			this.Draw = new Renderer(this.Client.transform, this.Client.RigParent);
			this.Animation = new Animation(this.Client.EventListener, this.Client.RigParent.transform, this.Client.Animations, this.Client.Controller, {} as unknown as DrawInformation);
			return;
		}
	}

	override OnDestroy() {
		this.Draw.Destroy();
		this.Connections.Clean();
	}

	override LateUpdate(DeltaTime: number) {
		// Host only sends data
		if (this.IsHost) {
			const DrawInfo = this.Client.RenderInfo;

			for (const [Index, Value] of pairs(DrawInfo)) {
				if (this.Link.Data[Index] !== Value) {
					this.Link.Data[Index] = Value as never;
				}
			}

			this.Link.PrepareReplicate();

			return;
		}

		// Client does drawing work
		this.Animation.DrawInfo = this.Link.Data;
		this.Animation.Speed = this.Link.Data.AnimationSpeed;
		this.Animation.Current = this.Link.Data.Animation;

		this.Draw.Draw(DeltaTime, this.Link.Data);
		this.Animation.Animate(DeltaTime);

		this.Animation.DynamicTilt(DeltaTime);
	}
}
