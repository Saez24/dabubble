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
  message = '';

  @Output() closeThreadEvent = new EventEmitter<void>();
  closeThread() {
    this.closeThreadEvent.emit();
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    console.log(event.emoji.native);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPicker = false;
    }
  }
}