import { Component } from '@angular/core';
import { ChatWindowComponent } from "./chat-window/chat-window.component";
import { WorkspaceComponent } from "./workspace/workspace.component";
import { ThreadComponent } from './thread/thread.component';
import { CommonModule, NgIf } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    ChatWindowComponent,
    WorkspaceComponent,
    ThreadComponent,
    CommonModule,
    NgIf
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  //for Thread Component
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'translateX(100%)'
      })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateX(0%)' }),
        animate('300ms ease-in-out', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})

export class BoardComponent {
  showThreadComponent = false;

  showThread() {
    this.showThreadComponent = true;
  }

  closeThread() {
    this.showThreadComponent = false;
  }
}
