import { Component } from '@angular/core';
import { ChatWindowComponent } from "./chat-window/chat-window.component";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    ChatWindowComponent
],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {

}
