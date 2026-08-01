import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ApiClientError, normalizeApiError } from '../../core/api/api-error';
import { AppDialog } from '../../shared/ui/app-dialog/app-dialog';
import { Student } from './students-api';
import { StudentsViewModel } from './students-viewmodel';

type FormMode = 'create' | 'edit';

export type StudentErrorDetail = {
  readonly message: string;
  readonly traceId?: string | null;
};

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppDialog],
  templateUrl: './students-page.html',
  styleUrl: './students-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [StudentsViewModel],
})
export class StudentsPage implements OnInit {
  protected readonly vm = inject(StudentsViewModel);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly deleteDialog = viewChild.required<AppDialog>('deleteDialog');
  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly tableRegionRef = viewChild<ElementRef<HTMLDivElement>>('tableRegion');
  private readonly formSummaryRef = viewChild<ElementRef<HTMLDivElement>>('formSummaryRef');
  private readonly nameInputRef = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly emailInputRef = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingStudent = signal<Student | null>(null);
  protected readonly studentToDelete = signal<Student | null>(null);

  protected readonly isSubmitting = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly formSummaryError = signal<StudentErrorDetail | null>(null);
  protected readonly deleteError = signal<StudentErrorDetail | null>(null);

  private triggerElement: HTMLElement | null = null;

  protected readonly studentForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(254), Validators.email],
    }),
  });

  ngOnInit(): void {
    this.vm.loadStudents();
    this.studentForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearControlApiError(this.studentForm.controls.name));
    this.studentForm.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearControlApiError(this.studentForm.controls.email));
  }

  protected openCreateDialog(trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('create');
    this.editingStudent.set(null);
    this.formSummaryError.set(null);
    this.studentForm.reset({ name: '', email: '' });
    this.formDialog().open(this.triggerElement ?? undefined);
  }

  protected openEditDialog(student: Student, trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('edit');
    this.editingStudent.set(student);
    this.formSummaryError.set(null);
    this.studentForm.setValue({
      name: student.name,
      email: student.email,
    });
    this.formDialog().open(this.triggerElement ?? undefined);
  }

  protected closeFormDialog(): void {
    if (!this.isSubmitting()) {
      this.formDialog().close();
    }
  }

  protected submitForm(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.clearApiErrors();
    this.studentForm.markAllAsTouched();
    if (this.studentForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const { name, email } = this.studentForm.getRawValue();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    this.isSubmitting.set(true);
    this.formSummaryError.set(null);

    const request = { name: trimmedName, email: trimmedEmail };
    const mode = this.formMode();
    const studentId = this.editingStudent()?.id;

    const action$ =
      mode === 'edit' && studentId
        ? this.vm.editStudent(studentId, request)
        : this.vm.signUpStudent(request);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formDialog().close();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const apiError = normalizeApiError(error);

        if (apiError.status === 404 && mode === 'edit') {
          this.formDialog().close();
          return;
        }

        this.handleFormApiError(apiError);
      },
    });
  }

  protected openDeleteDialog(student: Student, trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.studentToDelete.set(student);
    this.deleteError.set(null);
    this.deleteDialog().open(this.triggerElement ?? undefined);
  }

  protected closeDeleteDialog(): void {
    if (!this.isDeleting()) {
      this.deleteDialog().close();
      this.studentToDelete.set(null);
    }
  }

  protected confirmDelete(): void {
    const student = this.studentToDelete();
    if (!student || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.vm
      .deleteStudent(student.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.deleteDialog().close(true);
          this.studentToDelete.set(null);

          setTimeout(() => {
            if (this.triggerElement && !document.body.contains(this.triggerElement)) {
              this.focusHeadingOrTable();
            }
          }, 0);
        },
        error: (error: unknown) => {
          this.isDeleting.set(false);
          const apiError = normalizeApiError(error);

          if (apiError.status === 404) {
            this.deleteDialog().close(true);
            this.studentToDelete.set(null);
            return;
          }

          let message: string;
          if (apiError.status === 409) {
            message = apiError.detail || 'Este aluno possui matrículas e não pode ser excluído.';
          } else {
            message = apiError.detail || 'Não foi possível excluir o aluno.';
          }

          if (apiError.kind === 'network' || apiError.status === 500) {
            message = `${message} Atualize a lista para verificar o estado real antes de tentar novamente.`;
          }

          this.deleteError.set({ message, traceId: apiError.traceId });
        },
      });
  }

  protected getFieldError(fieldName: 'name' | 'email'): string | null {
    const control = this.studentForm.controls[fieldName];
    if (!control || !control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.errors?.['apiError']) {
      return control.errors['apiError'];
    }

    if (control.errors?.['required']) {
      return fieldName === 'name' ? 'Nome é obrigatório.' : 'E-mail é obrigatório.';
    }

    if (control.errors?.['minlength']) {
      return 'Nome deve ter pelo menos 2 caracteres.';
    }

    if (control.errors?.['maxlength']) {
      return fieldName === 'name'
        ? 'Nome deve ter no máximo 120 caracteres.'
        : 'E-mail deve ter no máximo 254 caracteres.';
    }

    if (control.errors?.['email']) {
      return 'Informe um e-mail válido.';
    }

    return 'Campo inválido.';
  }

  private clearControlApiError(control: AbstractControl): void {
    if (!control.errors?.['apiError']) {
      return;
    }
    const { apiError: _, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private clearApiErrors(): void {
    this.clearControlApiError(this.studentForm.controls.name);
    this.clearControlApiError(this.studentForm.controls.email);
  }

  private handleFormApiError(error: ApiClientError): void {
    let nameViolation: string | null = null;
    let emailViolation: string | null = null;
    const unknownViolations: string[] = [];

    for (const violation of error.violations) {
      if (violation.field === 'name' && nameViolation === null) {
        nameViolation = violation.message;
      } else if (violation.field === 'email' && emailViolation === null) {
        emailViolation = violation.message;
      } else {
        unknownViolations.push(violation.message);
      }
    }

    if (nameViolation !== null) {
      const control = this.studentForm.controls.name;
      control.setErrors({ ...control.errors, apiError: nameViolation });
      control.markAsTouched();
    }

    if (emailViolation !== null) {
      const control = this.studentForm.controls.email;
      control.setErrors({ ...control.errors, apiError: emailViolation });
      control.markAsTouched();
    }

    if (nameViolation === null && emailViolation === null && error.status === 409) {
      const detailLower = error.detail.toLowerCase();
      if (
        error.code === 'EMAIL_CONFLICT' ||
        error.code === 'EMAIL_ALREADY_EXISTS' ||
        detailLower.includes('e-mail') ||
        detailLower.includes('email')
      ) {
        emailViolation = error.detail;
        const control = this.studentForm.controls.email;
        control.setErrors({ ...control.errors, apiError: emailViolation });
        control.markAsTouched();
      }
    }

    let summaryMessage: string | null = null;
    if (unknownViolations.length > 0) {
      summaryMessage = unknownViolations.join(' ');
    } else if (nameViolation === null && emailViolation === null) {
      summaryMessage =
        error.detail || 'Não foi possível salvar os dados do aluno. Tente novamente.';
      if (error.kind === 'network' || error.status === 500) {
        summaryMessage = `${summaryMessage} Atualize a lista para verificar o estado real antes de tentar novamente.`;
      }
    }

    if (summaryMessage) {
      this.formSummaryError.set({ message: summaryMessage, traceId: error.traceId });
    }

    setTimeout(() => {
      if (this.formSummaryError()) {
        this.formSummaryRef()?.nativeElement.focus();
      } else {
        this.focusFirstInvalidField();
      }
    }, 0);
  }

  private focusFirstInvalidField(): void {
    if (this.studentForm.controls.name.invalid) {
      this.nameInputRef()?.nativeElement.focus();
    } else if (this.studentForm.controls.email.invalid) {
      this.emailInputRef()?.nativeElement.focus();
    }
  }

  private focusHeadingOrTable(): void {
    const tableRegion = this.tableRegionRef()?.nativeElement;
    const heading = this.headingRef()?.nativeElement;

    if (tableRegion && this.vm.itemCount() > 0) {
      tableRegion.focus();
    } else if (heading) {
      heading.focus();
    }
  }
}
