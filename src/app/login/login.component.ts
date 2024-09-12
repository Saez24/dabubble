import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CreateAccountComponent } from './create-account/create-account.component';
import { SignInComponent } from "./sign-in/sign-in.component";
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    RouterModule,
    CreateAccountComponent,
    SignInComponent,
    MatCardModule,
    MatIconModule
],
  templateUrl: './login.component.html',
  styleUrls: [
    './login.component.scss',
    './../../styles.scss'
  ]
})
export class LoginComponent {

  ngOnInit() {
  }

}
