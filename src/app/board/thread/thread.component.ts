import { ChangeDetectionStrategy, Component, HostListener, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, CommonModule, PickerComponent, NgIf, RouterModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ThreadComponent {
 
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  threadMessage = '';
  threadMessageArea = true;
  message = 'Ja das stimmt.';
  newMessage = '';

  @Output() closeThreadEvent = new EventEmitter<void>();
  closeThread() {
    this.closeThreadEvent.emit();
  }

  toggleEditBtn() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage() {
    this.threadMessageArea = false;
    this.toggleEditBtn()
    this.showMessageEditArea = true;
    this.newMessage = this.message ? this.message : '';
  };

  saveMessage() {
    this.message = this.newMessage;
    this.newMessage = '';
    this.showMessageEditArea = false;
    this.threadMessageArea = true;
  }

  cancelMessageEdit() {
    this.showMessageEditArea = false;
    this.threadMessageArea = true;
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    this.threadMessage += event.emoji.native;
    console.log(event.emoji.native);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.thread-message-icon')) {
      this.showEmojiPicker = false;
    }
  }
}