import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiClientError, normalizeApiError } from '../../core/api/api-error';
import { AppDialog } from '../../shared/ui/app-dialog/app-dialog';
import { Student } from './students-api';
import { StudentsViewModel } from './students-viewmodel';

type FormMode = 'create' | 'edit';

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

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly deleteDialog = viewChild.required<AppDialog>('deleteDialog');
  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly tableRegionRef = viewChild<ElementRef<HTMLDivElement>>('tableRegion');

  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingStudent = signal<Student | null>(null);
  protected readonly studentToDelete = signal<Student | null>(null);

  protected readonly isSubmitting = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly formSummaryError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

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

    this.studentForm.markAllAsTouched();
    if (this.studentForm.invalid) {
      return;
    }

    const { name, email } = this.studentForm.getRawValue();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    this.isSubmitting.set(true);
    this.formSummaryError.set(null);
    this.clearApiErrors();

    const request = { name: trimmedName, email: trimmedEmail };
    const mode = this.formMode();
    const studentId = this.editingStudent()?.id;

    const action$ =
      mode === 'edit' && studentId
        ? this.vm.editStudent(studentId, request)
        : this.vm.signUpStudent(request);

    action$.subscribe({
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

    this.vm.deleteStudent(student.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteDialog().close();
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
          this.deleteDialog().close();
          this.studentToDelete.set(null);
          return;
        }

        if (apiError.status === 409) {
          this.deleteError.set(
            apiError.detail || 'Este aluno possui matrículas e não pode ser excluído.',
          );
        } else {
          this.deleteError.set(apiError.detail || 'Não foi possível excluir o aluno.');
        }
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

  private clearApiErrors(): void {
    for (const key of ['name', 'email'] as const) {
      const control = this.studentForm.controls[key];
      if (control.errors?.['apiError']) {
        const { apiError: _, ...rest } = control.errors;
        control.setErrors(Object.keys(rest).length > 0 ? rest : null);
      }
    }
  }

  private handleFormApiError(error: ApiClientError): void {
    let mapped = false;

    if (error.violations && error.violations.length > 0) {
      for (const violation of error.violations) {
        if (violation.field === 'name') {
          this.studentForm.controls.name.setErrors({ apiError: violation.message });
          mapped = true;
        } else if (violation.field === 'email') {
          this.studentForm.controls.email.setErrors({ apiError: violation.message });
          mapped = true;
        }
      }
    }

    if (!mapped && error.status === 409) {
      const detailLower = error.detail.toLowerCase();
      if (
        error.code === 'EMAIL_CONFLICT' ||
        error.code === 'EMAIL_ALREADY_EXISTS' ||
        detailLower.includes('e-mail') ||
        detailLower.includes('email')
      ) {
        this.studentForm.controls.email.setErrors({ apiError: error.detail });
        mapped = true;
      }
    }

    if (!mapped) {
      this.formSummaryError.set(
        error.detail || 'Não foi possível salvar os dados do aluno. Tente novamente.',
      );
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
