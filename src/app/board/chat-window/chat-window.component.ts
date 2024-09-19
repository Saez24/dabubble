import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Output, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Message } from '../../shared/models/message.class';
import { User } from '../../shared/models/user.class';
import { Channel } from '../../shared/models/channel.class';



@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ChatWindowComponent {
  messages: Message[] = [];
  users: User[] = [];
  channels: Channel[] = [];
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  chatMessage = '';
  messageArea = true;
  message = 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Facilis minus quae, natus asperiores, rem ipsa delectus dolorem iste soluta, repudiandae esse? Magnam facilis distinctio illo, fuga nisi suscipit perspiciatis iure.';
  newMessage = '';

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage() {
    this.messageArea = false;
    this.showMessageEditToggle()
    this.showMessageEditArea = true;
  };

  saveMessage() {
    this.message += ' ' + this.newMessage;
    this.newMessage = '';
    this.showMessageEditArea = false;
    this.messageArea = true;
  }

  cancelMessageEdit() {
    this.showMessageEditArea = false;
    this.messageArea = true;
  }

  addEmoji(event: any) {
    this.chatMessage += event.emoji.native;
    console.log(event.emoji.native);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPicker = false;
    }
  }

  @Output() showThreadEvent = new EventEmitter<void>();
  showThread() {
    this.showThreadEvent.emit();
  }
}
