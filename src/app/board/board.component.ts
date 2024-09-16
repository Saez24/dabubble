import { Component } from '@angular/core';
import { WorkspaceComponent } from "./workspace/workspace.component";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [WorkspaceComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {

}
