import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Channel } from '../../../shared/models/channel.class';
import { ChannelsService } from '../../../shared/services/channels/channels.service';

@Component({
  selector: 'app-add-people-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    FormsModule,
  ],
  templateUrl: './add-people-dialog.component.html',
  styleUrls: ['./add-people-dialog.component.scss', '../create-new-channel-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class AddPeopleDialog {

  channel = new Channel();
  selectedValue: string = 'addAll';

  @Input()
  color: ThemePalette

  constructor(
    private channelsService: ChannelsService
  ) {
    this.channel = new Channel();
  }
  
  // createNewChannel() {
  //   this.channelsService.addChannel(this.channel);
  //   console.log('Kanal wurde erstellt:', this.channel);
  // }

  onSelectionChange(event: any) {
    console.log('Selected value:', event.value);
  }
}
