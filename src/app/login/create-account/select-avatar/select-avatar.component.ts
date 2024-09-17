import { NgClass, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { AvatarsService } from '../../../shared/services/avatars/avatars.service';

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [MatCardModule, NgFor, MatButtonModule, NgClass, NgStyle, MatIconModule],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class SelectAvatarComponent {

  avatars: string[] = [];
  selectedAvatar: string | null = null;
  avatarSelected = false;

  constructor(private _location: Location, private avatarsService: AvatarsService) { 
    this.avatars = this.avatarsService.getAvatars();
    this.shuffleAvatars();
  }

  chooseAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.avatarSelected = true;
  }

  shuffleAvatars() {
    for (let i = this.avatars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.avatars[i], this.avatars[j]] = [this.avatars[j], this.avatars[i]];
    }
  }

  goBack() {
    this._location.back();
  }
}
