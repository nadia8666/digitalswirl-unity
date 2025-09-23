import { Workspace as workspace } from "Code/@rbxts/services"

export const Workspace = workspace as Workspace & {
    Level: Folder & {
        Effects: Folder,
        Map: Folder & {
            Collision: Folder,
        },
        Objects: Folder,
        Rails: Folder,
        Water: Folder
    }
}