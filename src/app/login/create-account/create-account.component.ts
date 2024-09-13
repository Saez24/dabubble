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


  /**
   * This function is called when the "Weiter" button is clicked in the create account component.
   * It marks all form controls as touched and updates their validity.
   * If the form is valid, it navigates to the 'select-avatar' component.
   * If the form is invalid, it logs a message to the console.
   */
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
      this.router.navigate(['select-avatar']);
    } else {
    }
  }

  /**
   * Checks if all the form controls are valid.
   * @returns {boolean} Whether all the form controls are valid.
   */
  isFormValid(): boolean {
    return this.emailFormControl.valid &&
      this.passwordFormControl.valid &&
      this.nameFormControl.valid &&
      this.checkboxFormControl.valid;
  }

  /**
   * Navigates back to the previous URL.
   */
  goBack() {
    this._location.back();
  }

  /**
   * Toggles the visibility of the password input field.
   */
  showPassword(): void {
    this.passwordVisible = !this.passwordVisible;

  }
}
