import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CreateAccountComponent } from './login/create-account/create-account.component';
import { SelectAvatarComponent } from './login/select-avatar/select-avatar.component';
import { ResetPasswordComponent } from './login/reset-password/reset-password.component';
import { SignInComponent } from './login/sign-in/sign-in.component';

export const routes: Routes = [
    { path: '', component: LoginComponent,
        children: [
            { path: '', component: SignInComponent },
            { path: 'create-account', component: CreateAccountComponent },
            { path: 'selectavatar', component: SelectAvatarComponent },
            { path: 'reset-password', component: ResetPasswordComponent },
        ] },
];
