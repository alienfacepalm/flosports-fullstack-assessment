import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventsExplorer } from './events-explorer';

describe('EventsExplorer', () => {
  let component: EventsExplorer;
  let fixture: ComponentFixture<EventsExplorer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsExplorer],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsExplorer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
