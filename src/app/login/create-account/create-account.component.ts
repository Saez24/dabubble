import { Component, ViewEncapsulation } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { SelectAvatarComponent } from './select-avatar/select-avatar.component';
import { RouterModule } from '@angular/router';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule, MatCheckboxModule, MatButtonModule, SelectAvatarComponent, RouterModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CreateAccountComponent {

  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);
  nameFormControl = new FormControl('', [Validators.required]);
  checkboxFormControl = new FormControl(false, [Validators.requiredTrue]);
  formSubmitted = false;

  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();

  nextstep() {
    this.formSubmitted = true;
    if (this.emailFormControl.valid && this.passwordFormControl.valid && this.nameFormControl.valid && this.checkboxFormControl.valid) {
      console.log('Form is valid')
    } else {
      console.log('Form is invalid');
    }
  }
}
