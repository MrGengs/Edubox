import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CodingPage } from './coding.page';

describe('CodingPage', () => {
  let component: CodingPage;
  let fixture: ComponentFixture<CodingPage>;
  let toastController: jasmine.SpyObj<ToastController>;
  let alertController: jasmine.SpyObj<AlertController>;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);

    await TestBed.configureTestingModule({
      declarations: [CodingPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ToastController, useValue: toastSpy },
        { provide: AlertController, useValue: alertSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CodingPage);
    component = fixture.componentInstance;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with disconnected state', () => {
    expect(component.isConnected).toBeFalse();
    expect(component.matrix?.length).toBe(16);
    expect(component.matrix?.every(cell => cell === 0)).toBeTruthy();
  });

  it('should toggle matrix cell state', () => {
    const initialState = component.matrix?.[0] ?? 0;
    component.toggleCell(0);
    expect(component.matrix?.[0]).toBe(initialState === 1 ? 0 : 1);
  });

  it('should export matrix as JSON', () => {
    const testMatrix = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    component.matrix = testMatrix;
    component.exportMatrix();
    expect(component.matrixJson).toBe(JSON.stringify(testMatrix));
  });

  it('should clear log messages', () => {
    component.logMessages = ['test1', 'test2', 'test3'];
    component.clearLog();
    expect(component.logMessages).toEqual([]);
  });

  it('should have correct number of templates', () => {
    expect(component.templates?.length).toBe(5);
    expect(component.animations?.length).toBe(5);
  });

  it('should handle sendAnim when not connected', async () => {
    const toastSpy = jasmine.createSpy().and.returnValue(Promise.resolve({
      present: jasmine.createSpy()
    }));
    toastController.create.and.returnValue(toastSpy());

    await component.sendAnim(1);
    expect(toastController.create).toHaveBeenCalledWith({
      message: 'Not connected to Arduino!',
      duration: 2000,
      color: 'warning',
      position: 'top'
    });
  });

  it('should initialize matrix with correct size and values', () => {
    expect(component.matrix?.length).toBe(16);
    component.matrix?.forEach(cell => {
      expect(cell).toBe(0);
    });
  });

  it('should properly format template entries', () => {
    component.templates?.forEach((entry, index) => {
      expect(entry.name).toBe(`Animasi ${index + 1}`);
      expect(entry.code).toContain('void anim');
    });
  });
});