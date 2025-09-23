import { Workspace } from "Code/shared/common/globals"
import SrcObject from "./objects/baseobj"
import { Client } from ".."
import { AddLog } from "Code/shared/common/utility/logger"


// TODO: see if theres a better way to do this
// a dynamic list for all that extends SrcObject would be nice, and could also be implemented for states rather than a fixed registry
const ObjectClasses = new Map<string, typeof SrcObject>()
for (const [_, Module] of pairs((script.Parent as Folder & { objects: Folder }).objects.GetDescendants())) {
    if (!Module.IsA("ModuleScript")) { continue }
    const Class = require(Module) as typeof SrcObject
    ObjectClasses.set(tostring(Class), Class)
}

export class ObjectController {
    public Params: RaycastParams
    public Objects: Map<Model, SrcObject>
    public Skin: number = 1
    private Client

    constructor(Client: Client) {
        this.Objects = new Map()
        this.Client = Client

        for (const [_, Model] of pairs(Workspace.Level.Objects.GetDescendants())) {
            if (!Model.IsA("Model")) { continue }

            const Class = ObjectClasses.get(Model.Name)
            if (!Class) {
                AddLog(`Failed to initialize Object ${Model}, unable to find corresponding Object module!`)
                continue
            }

            const Target = new Class(Model)

            this.Objects.set(Model, Target)
        }

        this.Params = new RaycastParams()
        this.Params.FilterType = Enum.RaycastFilterType.Include
        this.Params.FilterDescendantsInstances = [Workspace.Level.Objects]
    }

    public CollideWithClient() {
        const LastPosition = this.Client.LastCFrame.Position
        if (LastPosition !== this.Client.Position) {
            const Look = CFrame.lookAt(LastPosition, this.Client.Position)
            const Magnitude = LastPosition.sub(this.Client.Position).Magnitude

            const Cast = Workspace.Spherecast(LastPosition.sub(Look.LookVector.mul(this.Skin)), this.Skin, Look.LookVector.mul(Magnitude + this.Skin), this.Params)
            if (Cast) {
                const Model = Cast.Instance.FindFirstAncestorOfClass("Model")

                if (Model) {
                    this.Objects.get(Model)?.TouchClient(this.Client)
                }
            }
        }
    }

    public TickObjects() {
        for (const [_, Object] of pairs(this.Objects)) {
            Object.Tick(() => {
                return this.Client
            })
        }
    }
}