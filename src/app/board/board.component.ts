import { Component } from '@angular/core';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WorkspaceComponent } from "./workspace/workspace.component";
import { ThreadComponent } from './thread/thread.component';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    ChatWindowComponent,
    WorkspaceComponent,
    MatButtonModule,
    MatSidenavModule,
    ThreadComponent,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', '../../../src/styles.scss']
})
export class BoardComponent {
  showFiller = false;


}
