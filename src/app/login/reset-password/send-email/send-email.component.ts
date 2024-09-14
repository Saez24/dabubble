import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../../account.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, ReactiveFormsModule, RouterModule],
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class SendEmailComponent {
  constructor(private accountService: AccountService) { }

  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();

  isButtonDisabled(): boolean {
    const control = this.emailFormControl as FormControl;
    return control.invalid || control.value?.trim() === '';
  }

  goBack() {
    this.accountService.goBack();
  }
}
