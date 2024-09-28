
import { Component, Inject, Input, NgModule, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, NgForm, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher, ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ChannelsService } from '../../../shared/services/channels/channels.service';
import { CreateNewChannelDialog } from '../create-new-channel-dialog.component';
import { Channel } from '../../../shared/models/channel.class';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy, arrayUnion } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { User } from '../../../shared/models/user.class';
import { NgFor, NgIf, NgStyle } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../shared/services/authentication/auth-service/auth.service';


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

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
    CreateNewChannelDialog,
    NgIf,
    NgFor,
    NgStyle,
    MatInputModule,
  ],
  templateUrl: './add-people-dialog.component.html',
  styleUrls: ['./add-people-dialog.component.scss', '../create-new-channel-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class AddPeopleDialog implements OnInit {

  selectedValue: string = 'addAll';
  searchTerm: string = '';
  channel: Channel | null = null;
  newChannelName: string = '';
  newChannelDescription: string = '';
  users: User[] = [];
  userId: string | null = null;
  currentUserUid: string | null = null;
  filteredUsers: User[] = [];
  userSelected: boolean = false;
  selectedUsers: User[] = [];
  ownUserError: boolean = false;

  @Input()
  color: ThemePalette
  dialogRef: any;
  
  constructor( 
    private firestore: Firestore,
    private auth: Auth,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  serchTermControl = new FormControl('', [Validators.required]);
  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();
  formSubmitted = false;

  ngOnInit(): void {
    this.checkDataFromDialog();
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
        this.createNewChannel();
    } else {
        console.log('Form is invalid');
    }
  }

  checkDataFromDialog() {
    this.newChannelName = this.data.name || '';
    this.newChannelDescription = this.data.description || '';
    this.users = this.data.users.users || [];
  }

  async createNewChannel() {
    let currentUser = this.auth.currentUser;

    if (currentUser) {
        let memberUids = this.getMemberUids();
        let newChannel = await this.createChannel(memberUids);

        if (newChannel) {
            await this.updateUserChannels(currentUser.uid, newChannel.name);
        }
    }
}

async createChannel(memberUids: string[]): Promise<Channel | null> {
    let channelsRef = collection(this.firestore, 'channels');
    let newChannel: Channel = new Channel({
        name: this.newChannelName,
        description: this.newChannelDescription,
        members: memberUids,
        channelAuthor: this.currentUserUid,
    });

    await addDoc(channelsRef, {
        name: newChannel.name,
        description: newChannel.description,
        memberUids: newChannel.memberUids,
        channelAuthorId: newChannel.channelAuthorId,
    });

    return newChannel;
}

async updateUserChannels(userId: string, channelName: string) {
    let usersRef = collection(this.firestore, 'users');
    let userDocRef = doc(usersRef, userId);

    await updateDoc(userDocRef, {
        channels: arrayUnion(channelName),
    });
}

// Only the id of the users is pushed to the firestore
getMemberUids(): string[] {
  let memberUids: string[];

  if (this.selectedValue === 'addAll') {
      memberUids = this.users.map(user => user.id);
  } else if (this.selectedValue === 'specific') {
      memberUids = this.selectedUsers.map(selectedUser => selectedUser.id);
      // channelAuthor must be pushed into channel as well
      if (this.currentUserUid) {                     
        memberUids.push(this.currentUserUid);
    }
  } else {
      memberUids = [];
  }

  return memberUids;
}


  filterUsers() {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    if(this.searchTerm) {
      this.userSelected = true
    }
  }

  showUsers() {
    this.userSelected = !this.userSelected;
    console.log(this.userSelected)
  }

  deleteUser(userId: string) {
  if (userId) {
    let userToDelete = this.selectedUsers.find(user => user.id === userId);
    this.selectedUsers = this.selectedUsers.filter(user => user.id !== userId);
    
    if (userToDelete) {
      console.log(`User deleted: ${userToDelete.name} (ID: ${userToDelete.id})`);
    } else {
      console.log(`User with ID: ${userId} not found.`);
    }
  }
}

selectUser(user: User): void {
  this.userSelected! = this.userSelected;

  if (this.currentUserUid === user.id) {
      this.ownUserError = true; 
  } else {
      if (!this.selectedUsers.find(selectedUser => selectedUser.id === user.id)) {
          this.selectedUsers.push(user);
          this.ownUserError = false; 
      } else {
          this.ownUserError = false;
      }
  }

  this.searchTerm = '';
}



  onSelectionChange(event: any) {
    this.selectedValue = event.value;
  }
}
