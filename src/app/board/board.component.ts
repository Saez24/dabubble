import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ChatWindowComponent } from "./chat-window/chat-window.component";
import { WorkspaceComponent } from "./workspace/workspace.component";
import { ThreadComponent } from './thread/thread.component';
import { CommonModule, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { IconsService } from '../shared/services/icons/icons.service';

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
    MatIconModule,
    ChatWindowComponent,
    WorkspaceComponent,
    ThreadComponent,
    CommonModule,
    NgIf,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class BoardComponent {

  @ViewChild('drawer') drawer!: MatDrawer;

  searchInput: string = '';
  showThreadComponent: boolean = true;
  workspaceOpen: boolean= true;

  constructor (private iconsService: IconsService ) { }

  closeThread() {
    this.showThreadComponent = false;
  }


  showThread() {
    this.showThreadComponent = true;
  }

  toggleWorkspace() {
    this.drawer.toggle();
    if(!this.workspaceOpen) {
      this.workspaceOpen = true;
    } else {
      this.workspaceOpen = false;
    }
  }
}