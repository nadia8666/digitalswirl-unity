import { NetworkUtil } from "@Easy/Core/Shared/Util/NetworkUtil"
import { Network } from "Code/Shared/Network"
import Client from "./Client"

export default class Framework extends AirshipSingleton {
    override Start() {
        if ($SERVER && !$CLIENT) { return }

        Network.EnableClient.client.OnServerEvent((NetID) => {
            const Object = NetworkUtil.WaitForNetworkIdentityTimeout(NetID, 5)

            if (Object) {
                Object.gameObject.GetAirshipComponent<Client>()!.enabled = true
            }
        })

        Network.Replication.AnimationChanged.client.OnServerEvent((NetworkID, Animation, Speed, Mode) => {
            const Object = NetworkUtil.WaitForNetworkIdentityTimeout(NetworkID, 5)

            if (Object) {
                const Animator = Object.GetComponent<Animator>()

                if (Animator) {
                    if (Mode === 1 || Mode === 2) {
                        Animator.SetFloat(`AnimSpeed`, Speed)
                    }

                    if (Mode === 0 || Mode === 2) {
                        Animator.CrossFade(Animation, .15)
                    }
                }
            }
        })
    }
}