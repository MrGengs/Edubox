import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModulPage } from './modul.page';

describe('ModulPage', () => {
  let component: ModulPage;
  let fixture: ComponentFixture<ModulPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
