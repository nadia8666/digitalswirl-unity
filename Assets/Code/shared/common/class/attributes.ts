export type ValidAttributeTypes = string | number | boolean | UDim | UDim2 | BrickColor | Color3 | Vector3 | Vector2 | NumberSequence | ColorSequence | NumberRange

// not a class but Close enough that i dont care.
export function Attributes<T extends {[Index:string]: ValidAttributeTypes}>(Object: Instance) {
    return setmetatable({} as T & {
        (AttributeChanged:keyof T): RBXScriptSignal
    }, {
        __index: (_, Index) => {
            return Object.GetAttribute(Index as unknown as string)
        },
        __newindex: (_, Index, Value) => {
            Object.SetAttribute(Index as unknown as string, Value as unknown as ValidAttributeTypes)
        },
        __call: (_, AttributeChanged) => {
            assert(typeOf(AttributeChanged) === "string", `Attribute provided was not string.`)

            return Object.GetAttributeChangedSignal(AttributeChanged as unknown as string)
        }
    })
}

export function GetAttribute<T extends ValidAttributeTypes>(Instance: Instance, Attribute:string, Value?:T): T extends undefined ? unknown|undefined : T {
    if (Value !== undefined && Instance.GetAttribute(Attribute) === undefined) { Instance.SetAttribute(Attribute, Value) }

    const ToReturn = Instance.GetAttribute(Attribute)

    return ToReturn as T extends undefined ? unknown | undefined : T
}
