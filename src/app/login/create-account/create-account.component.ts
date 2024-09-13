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
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

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

  constructor(private _location: Location, private router: Router) { }

  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);
  nameFormControl = new FormControl('', [Validators.required]);
  checkboxFormControl = new FormControl(false, [Validators.requiredTrue]);
  formSubmitted = false;
  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();
  passwordVisible: boolean = false;

  nextStep() {
    this.formSubmitted = true;
    this.emailFormControl.markAsTouched();
    this.passwordFormControl.markAsTouched();
    this.nameFormControl.markAsTouched();
    this.checkboxFormControl.markAsTouched();

    this.emailFormControl.updateValueAndValidity();
    this.passwordFormControl.updateValueAndValidity();
    this.nameFormControl.updateValueAndValidity();
    this.checkboxFormControl.updateValueAndValidity();

    if (this.isFormValid()) {
      this.router.navigate(['selectavatar']);
      console.log('Form is valid');
    } else {
      console.log('Form is invalid');
    }
  }

  isFormValid(): boolean {
    return this.emailFormControl.valid &&
      this.passwordFormControl.valid &&
      this.nameFormControl.valid &&
      this.checkboxFormControl.valid;
  }

  backClicked() {
    this._location.back();
  }

  showPassword(): void {
    this.passwordVisible = !this.passwordVisible;

  }
}
