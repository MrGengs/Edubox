import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AiChatPage } from './ai-chat.page';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

describe('AiChatPage', () => {
  let component: AiChatPage;
  let fixture: ComponentFixture<AiChatPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiChatPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial messages', () => {
    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.messages[0].isUser).toBeFalse();
    expect(component.messages[0].text).toContain('Halo!');
  });

  it('should add user message and get AI response', () => {
    const initialMessageCount = component.messages.length;
    const testMessage = 'Halo, apa kabar?';
    
    component.newMessage = testMessage;
    component.sendMessage();
    
    expect(component.messages.length).toBe(initialMessageCount + 1);
    expect(component.messages[initialMessageCount].isUser).toBeTrue();
    expect(component.messages[initialMessageCount].text).toBe(testMessage);
    
    // AI response should be added asynchronously
    fixture.detectChanges();
    expect(component.messages.length).toBe(initialMessageCount + 2);
  });

  it('should not send empty message', () => {
    const initialMessageCount = component.messages.length;
    
    component.newMessage = '   ';
    component.sendMessage();
    
    expect(component.messages.length).toBe(initialMessageCount);
  });
});
