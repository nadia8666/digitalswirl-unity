import _OBJBase from "./Base";

export interface AnimateObject<States extends string> {
	Animator: Animator;
	Listener: AnimationEventListener;
	AnimationController: AnimatedObject<States>;

	UpdateAnimationState(): void;
	AnimationEnded(): void;
}

export class AnimatedObject<T extends string> {
	public LastAnimation: string;
	public AnimationState: string;

	constructor(private Base: _OBJBase & AnimateObject<T>) {
		assert(Base.Animator !== undefined, `Class ${Base} missing AnimatedObject injection!`);

		Base.meta.AnimationLoader = true;

		Base.Listener.OnAnimEvent((Key) => {
			if (Key === "EndAnimation") Base.AnimationEnded();
		});
	}

	public Animate(this: _OBJBase & AnimateObject<T> & { AnimationController: AnimatedObject<T> }) {
		this.UpdateAnimationState();

		if (this.AnimationController.LastAnimation !== this.AnimationController.AnimationState) {
			this.Animator.CrossFadeInFixedTime(this.AnimationController.AnimationState, 0.15, 0);
			this.AnimationController.LastAnimation = this.AnimationController.AnimationState;
		}
	}
}
