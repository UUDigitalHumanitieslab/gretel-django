import { ChangeDetectorRef, Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { animationFrames, map, takeWhile, endWith, Subscription, Observable } from 'rxjs';
import bezier from 'bezier-easing';
import { formatNumber } from '@angular/common';

const animationTime = 200; // ms
const easing = bezier(0.00, 0.67, 0.41, 1);

@Pipe({
    name: 'transitionNumbers',
    pure: false
})
export class TransitionNumbersPipe implements PipeTransform {
    private current = 0;
    private target = 0;
    private ref: ChangeDetectorRef;
    private subscription: Subscription = undefined;

    constructor(ref: ChangeDetectorRef, @Inject(LOCALE_ID) private locale: string) {
        this.ref = ref;
    }

    /**
     * Transforms a text to highlight all the text matching the specified query.
     */
    transform(value?: number, transitionBackwards = false) {
        if (value === undefined || value === null) {
            if (this.subscription) {
                this.subscription.unsubscribe();
                delete this.subscription;
            }
            return '';
        }

        if (this.target !== value) {
            this.subscription?.unsubscribe();
            this.target = value;

            if (this.current == 0 || !transitionBackwards && this.current > this.target) {
                // don't animate the first jump after loading
                // jumping backwards?
                // (query was updated, don't animate this jump either)
                this.current = this.target;
            } else {
                this.subscription = this.animate(this.current, this.target, animationTime).subscribe(
                    value => {
                        this.current = Math.round(value);
                        this.ref.markForCheck();
                    }
                );
            }
        }

        return formatNumber(this.current, this.locale);
    }

    private animate(start: number, end: number, duration: number): Observable<number> {
        const diff = end - start;
        return animationFrames().pipe(
            // from 0 to 1
            map(({ elapsed }) => elapsed / duration),
            takeWhile(v => v < 1),
            endWith(1),
            map(v => easing(v) * diff + start)
        );
    }
}
