import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon'; 
import { MatCardModule } from '@angular/material/card';
import { IconsService } from '../../shared/services/icons/icons.service';
import { AvatarsService } from '../../shared/services/avatars/avatars.service';
import { NgClass, NgFor } from '@angular/common';
import { ChannelsService } from '../../shared/services/channels/channels.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatCardModule, NgFor, NgClass], 
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss', 
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class WorkspaceComponent {

  panelOpenState = false;
  avatars: string[] = [];
  arrowRotated: boolean[] = [false, false]; 
  channels: string[] = [];
  channelClicked: boolean[] = [];
  icons: string[] = [];

  constructor(
    private iconsService: IconsService, 
    private avatarsService: AvatarsService,
    private channelsService: ChannelsService,
  ) {
    this.avatars = this.avatarsService.getAvatars();
    this.channels = this.channelsService.getChannels();
    this.icons = this.iconsService.getIcons();
    this.channelClicked = Array(this.channels.length).fill(false); 
   }

   
  rotateArrow(i: number){
    this.arrowRotated[i] = !this.arrowRotated[i];  
  }

  clickChannel(i: number) {
    this.channelClicked = Array(this.channels.length).fill(false);
    this.channelClicked[i] = true;
  }

}

