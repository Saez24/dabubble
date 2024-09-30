import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { IconsService } from '../../shared/services/icons/icons.service';
import { Channel } from '../../shared/models/channel.class';
import { collection, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { User } from '../../shared/models/user.class';
import { Auth } from '@angular/fire/auth';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-channel-description-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './channel-description-dialog.component.html',
  styleUrls: ['./channel-description-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ChannelDescriptionDialogComponent {

  nameFormControl = new FormControl('', [Validators.required]);
  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();
  formSubmitted = false;
  channel: Channel | [] = [];
  users: User[] = [];
  currentUser: User | undefined;
  currentChannelName: string = '';
  currentChannelDescription: string = '';

  constructor(
    public channelsService: ChannelsService,
    public iconsService: IconsService,
    public firestore: Firestore,
    private auth: Auth,
  ) { 
    
  }

  ngOnInit(): void {
    this.channel = this.channelsService.channel;
    this.loadUsers();
    console.log(this.channel);
  }

  async loadUsers() {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
        this.users = await Promise.all(snapshot.docs.map(async (doc) => {
            let userData = doc.data() as User;
            return { ...userData, id: doc.id };
        }));

        let currentUser = this.auth.currentUser;
        if (currentUser) {
            this.currentUser = this.findUserById(currentUser.uid);
            } else {
                console.log('Logged-in user not found in the users list.');
            }
        });
  }

  findUserById(userId: string): User | undefined {
    return this.users.find(user => user.id === userId);
}

  editChannel() {

  }

}


