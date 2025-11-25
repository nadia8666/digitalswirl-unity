export default class TagCheckComponent extends AirshipBehaviour {
    public Tags = ["Character", "NoFloor", "Rail"]
    
    override Start() {
        for (const [_, v] of pairs(this.Tags)) {
            const Test = pcall(() => {
                GameObject.FindGameObjectWithTag(v)
            })

            if (Test)
                print(`Tag ${v} EXISTS!`)
            else
                print(`Tag ${v} FAILED!`)
        }
    }
}