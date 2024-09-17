import { Component } from '@angular/core';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WorkspaceComponent } from "./workspace/workspace.component";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ChatWindowComponent, WorkspaceComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {

}
