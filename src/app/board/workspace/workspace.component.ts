import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon'; 
import { MatCardModule } from '@angular/material/card';
import { IconsService } from '../../shared/services/icons/icons.service';
import { NgClass, NgFor, NgStyle } from '@angular/common';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewChannelDialog } from './create-new-channel-dialog/create-new-channel-dialog.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    MatExpansionModule, 
    MatIconModule, 
    MatCardModule, 
    NgFor, 
    NgClass, 
    NgStyle,
    CreateNewChannelDialog
  ], 
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss', 
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class WorkspaceComponent {

  panelOpenState = false;
  arrowRotated: boolean[] = [false, false]; 
  channels: string[] = [];
  clickedChannels: boolean[] = [];
  clickedUsers: boolean[] = [];
  icons: string[] = [];

  users = [
    { firstName: 'Anna', lastName: 'Müller', avatar: '../../../../assets/images/avatars/avatar1.svg', online: true },
    { firstName: 'Ben', lastName: 'Schmidt', avatar:  '../../../../assets/images/avatars/avatar2.svg', online: true },
    { firstName: 'Clara', lastName: 'Meier', avatar: '../../../../assets/images/avatars/avatar3.svg', online: true },
    { firstName: 'David', lastName: 'Schneider', avatar: '../../../../assets/images/avatars/avatar4.svg', online: false },
    { firstName: 'Ella', lastName: 'Fischer', avatar: '../../../../assets/images/avatars/avatar5.svg', online: true },
    { firstName: 'Felix', lastName: 'Weber', avatar: '../../../../assets/images/avatars/avatar6.svg', online: true }
  ];

  constructor(
    public dialog: MatDialog,
    private iconsService: IconsService, 
    private channelsService: ChannelsService,
  ) {
    this.channels = this.channelsService.getChannels();
    this.icons = this.iconsService.getIcons();
    this.setClickedArrays();
   }

   
  rotateArrow(i: number){
    this.arrowRotated[i] = !this.arrowRotated[i];  
  }

  clickChannel (i: number) {
    this.clickedChannels.fill(false);
    this.clickedUsers.fill(false);
    this.clickedChannels[i] = true;
  }

  clickUser (i: number) {
    this.clickedUsers.fill(false);
    this.clickedChannels.fill(false);
    this.clickedUsers[i] = true;
  }

  setClickedArrays() {
    this.clickedChannels = Array(this.channels.length).fill(false);
    this.clickedUsers = Array(this.users.length).fill(false);
  }

  
  openDialog() {
    this.dialog.open(CreateNewChannelDialog);
  }
}



