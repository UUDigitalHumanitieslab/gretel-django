import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AboutPageComponent } from './about-page.component';
import { commonTestBed } from '../../common-test-bed';

describe('AboutPageComponent', () => {
    let component: AboutPageComponent;
    let fixture: ComponentFixture<AboutPageComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AboutPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
