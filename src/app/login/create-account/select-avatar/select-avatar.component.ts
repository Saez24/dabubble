import { NgClass, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from '../../../account.service';

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [MatCardModule, NgFor, MatButtonModule, NgClass, NgStyle, MatIconModule],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
})
export class SelectAvatarComponent implements OnInit {

  constructor(private accountService: AccountService) { }

  avatars = [
    '../../../../assets/images/avatars/avatar1.svg',
    '../../../../assets/images/avatars/avatar2.svg',
    '../../../../assets/images/avatars/avatar3.svg',
    '../../../../assets/images/avatars/avatar4.svg',
    '../../../../assets/images/avatars/avatar5.svg',
    '../../../../assets/images/avatars/avatar6.svg',
  ];

  selectedAvatar: string | null = null;
  avatarSelected = false;

  ngOnInit() {
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
      this.accountService.goBack();
    }
  }
