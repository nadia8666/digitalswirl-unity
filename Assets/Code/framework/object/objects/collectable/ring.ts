import { Client } from "Code/framework";
import SrcObject from "../baseobj";
import { TweenService } from "Code/@rbxts/services";
import { GetAttribute } from "Code/shared/common/class/attributes";

/**
 * @class
 * @object
 * @augments SrcObject
 */
class Ring extends SrcObject {
    public Triggered: boolean = false

    constructor(Object: Model) {
        super(Object)
    }

    protected OnTouch(Client: Client) {
        if (this.Triggered) { return }
        this.Triggered = true

        Client.Sound.Play("Object/Ring/Activate")

        Client.CollectState.AddRings(1)
        Client.CollectState.AddScore(10)

        this.SetTransparency(1)
    }

    protected OnRespawn() {
        this.Triggered = false
        this.SetTransparency(1)
    }

    private SetTransparency(Transparency: number) {
        for (const [_, Instance] of pairs(this.Object.GetDescendants())) {
            if (Instance.IsA("BasePart") || Instance.IsA("Decal")) {
                Instance.LocalTransparencyModifier = Transparency
            } else if (Instance.IsA("Light")) {
                const DefaultBright = GetAttribute(Instance, "DefaultBrightness", Instance.Brightness)

                TweenService.Create(Instance, new TweenInfo(1), { Brightness: Transparency === 1 ? 0 : DefaultBright }).Play()
            }
        }
    }
}

export = Ring