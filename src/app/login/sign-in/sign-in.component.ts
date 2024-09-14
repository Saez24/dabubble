import { Component, ViewEncapsulation, inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { GoogleAuthService } from '../../shared/services/authentication/google-auth-service/google-auth.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    RouterModule,
    MatDividerModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss', './../../../styles.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SignInComponent {

  googleAuthService = inject(GoogleAuthService);
  router = inject(Router);

  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);
  nameFormControl = new FormControl('', [Validators.required]);
  checkboxFormControl = new FormControl(false, [Validators.requiredTrue]);
  formSubmitted = false;

  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();


  async googleLogin(): Promise<void> {
    try {
      await this.googleAuthService.googlePopupLogin();
      this.router.navigateByUrl('board');
    } catch (err) {
      console.error('Google login error:', err);
    }
  }


  guestSignIn(): void {
    this.router.navigateByUrl('board');
  }


  signIn(): void {

    }
}
