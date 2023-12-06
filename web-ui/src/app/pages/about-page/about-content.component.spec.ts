import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AboutContentComponent } from './about-content.component';
import { commonTestBed } from '../../common-test-bed';

describe('AboutContentComponent', () => {
    let component: AboutContentComponent;
    let fixture: ComponentFixture<AboutContentComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AboutContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
