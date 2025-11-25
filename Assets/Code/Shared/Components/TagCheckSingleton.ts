const Tags = ["Character", "NoFloor", "Rail"] as const

export default class TagCheckSingleton extends AirshipSingleton {
    public FoundTags = new Map<string, boolean>()

    override Start() {
        for (const [_, v] of pairs(Tags)) {
            const Test = pcall(() => {
                GameObject.FindGameObjectWithTag(v)
            })
            
            this.FoundTags.set(v, Test ? true : false)

            if (Test)
                print(`Tag ${v} EXISTS!`)
            else
                print(`Tag ${v} FAILED!`)
        }
    }

    public TagExists(TagName: typeof Tags[number]) {
        return this.FoundTags.get(TagName) ? true : false
    }
}