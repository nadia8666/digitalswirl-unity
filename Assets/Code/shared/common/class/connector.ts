export class Connector {
    private ConnectionList = new Array<RBXScriptConnection>()

    public Add(Connection: RBXScriptConnection) {
        this.ConnectionList.push(Connection)
    }

    public Get() {
        return this.ConnectionList
    }

    public Disconnect() {
        for (const [_, Connection] of pairs(this.ConnectionList)) {
            Connection.Disconnect()
        }

        this.ConnectionList.clear()
    }
}