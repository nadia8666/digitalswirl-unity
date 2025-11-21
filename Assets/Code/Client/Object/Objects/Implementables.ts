import _OBJBase from "./Base"

export interface AnimatedObject<States extends string> {
    Animator: Animator
    AnimationState: States
    Listener: AnimationEventListener

    UpdateAnimationState(): void
    AnimationEnded(): void
}

/**
 * Injects the object animation player into your Object class
 */
export const AnimateObject = {
    Inject: function (Class: _OBJBase & AnimatedObject<string>) {
        if ((Class as unknown as { Animator: unknown }).Animator === undefined) {
            error(`Class ${Class} missing AnimatedObject injection!`)
        }

        Class.Injects.AnimationLoader = true

        let LastAnimation = "0";
        (Class as unknown as { Animate: (this: _OBJBase & AnimatedObject<string>) => void }).Animate = function (this: _OBJBase & AnimatedObject<string>) {
            this.UpdateAnimationState()

            if (LastAnimation !== this.AnimationState) {
                this.Animator.CrossFadeInFixedTime(this.AnimationState, .15, 0)
                LastAnimation = this.AnimationState
            }
        }

        Class.Listener.OnAnimEvent((Key) => {
            if (Key === "EndAnimation")
                Class.AnimationEnded()
        })
    }
}