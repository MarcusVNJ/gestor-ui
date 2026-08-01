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
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { AcademicClass } from '../academic-classes/academic-classes-api';
import { Student } from '../students/students-api';
import { Enrollment } from './enrollments-api';
import { EnrollmentsViewModel } from './enrollments-viewmodel';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppDialog, StatusBadge],
  templateUrl: './enrollments-page.html',
  styleUrl: './enrollments-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EnrollmentsViewModel],
})
export class EnrollmentsPage implements OnInit {
  protected readonly vm = inject(EnrollmentsViewModel);

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly studentSelectRef = viewChild<ElementRef<HTMLSelectElement>>('studentSelect');
  private readonly classSelectRef = viewChild<ElementRef<HTMLSelectElement>>('classSelect');

  protected readonly isSubmitting = signal(false);
  protected readonly formSummaryError = signal<string | null>(null);
  protected readonly createdEnrollment = signal<Enrollment | null>(null);
  protected readonly createdStudent = signal<Student | null>(null);
  protected readonly createdClass = signal<AcademicClass | null>(null);

  private triggerElement: HTMLElement | null = null;

  protected readonly enrollmentForm = new FormGroup({
    studentId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    academicClassId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.vm.loadOptions();
  }

  protected openCreateDialog(trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.createdEnrollment.set(null);
    this.createdStudent.set(null);
    this.createdClass.set(null);
    this.formSummaryError.set(null);
    this.clearApiErrors();
    this.enrollmentForm.reset({ studentId: '', academicClassId: '' });
    this.formDialog().open(this.triggerElement ?? undefined);
  }

  protected closeFormDialog(): void {
    if (!this.isSubmitting()) {
      this.formDialog().close();
    }
  }

  protected resetFormAndCreateAnother(): void {
    this.createdEnrollment.set(null);
    this.createdStudent.set(null);
    this.createdClass.set(null);
    this.formSummaryError.set(null);
    this.clearApiErrors();
    this.enrollmentForm.reset({ studentId: '', academicClassId: '' });
  }

  protected submitForm(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.enrollmentForm.markAllAsTouched();
    if (this.enrollmentForm.invalid || !this.vm.hasOpenAcademicClasses()) {
      this.focusFirstInvalidField();
      return;
    }

    const { studentId, academicClassId } = this.enrollmentForm.getRawValue();

    this.isSubmitting.set(true);
    this.formSummaryError.set(null);
    this.clearApiErrors();

    this.vm.enrollStudent({ studentId, academicClassId }).subscribe({
      next: (enrollment) => {
        this.isSubmitting.set(false);
        this.createdEnrollment.set(enrollment);

        const foundStudent = this.vm.students().find((s) => s.id === studentId) ?? null;
        const foundClass = this.vm.academicClasses().find((c) => c.id === academicClassId) ?? null;

        this.createdStudent.set(foundStudent);
        this.createdClass.set(foundClass);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const apiError = normalizeApiError(error);
        this.handleFormApiError(apiError);
      },
    });
  }

  protected getStudentIdError(): string | null {
    const control = this.enrollmentForm.controls.studentId;
    if (!control || !control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.errors?.['apiError']) {
      return control.errors['apiError'];
    }

    if (control.errors?.['required']) {
      return 'Selecione um aluno.';
    }

    return 'Seleção de aluno inválida.';
  }

  protected getAcademicClassIdError(): string | null {
    const control = this.enrollmentForm.controls.academicClassId;
    if (!control || !control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.errors?.['apiError']) {
      return control.errors['apiError'];
    }

    if (control.errors?.['required']) {
      return 'Selecione uma turma.';
    }

    return 'Seleção de turma inválida.';
  }

  private clearApiErrors(): void {
    for (const key of ['studentId', 'academicClassId'] as const) {
      const control = this.enrollmentForm.controls[key];
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
        if (violation.field === 'studentId') {
          this.enrollmentForm.controls.studentId.setErrors({
            apiError: violation.message,
          });
          mapped = true;
        } else if (violation.field === 'academicClassId') {
          this.enrollmentForm.controls.academicClassId.setErrors({
            apiError: violation.message,
          });
          mapped = true;
        }
      }
    }

    if (!mapped && error.status === 409) {
      this.formSummaryError.set(
        error.detail || 'Matrícula duplicada: este aluno já está matriculado nesta turma.',
      );
      mapped = true;
    }

    if (!mapped && error.status === 400) {
      this.formSummaryError.set(
        error.detail ||
          'A turma selecionada está fechada ou indisponível. A lista de turmas foi atualizada.',
      );
      mapped = true;
    }

    if (!mapped && error.status === 404) {
      this.formSummaryError.set(
        error.detail ||
          'O aluno ou a turma selecionada não foi encontrada. As listas foram atualizadas.',
      );
      mapped = true;
    }

    if (!mapped) {
      this.formSummaryError.set(
        error.detail || 'Não foi possível realizar a matrícula. Tente novamente.',
      );
    }
  }

  private focusFirstInvalidField(): void {
    if (this.enrollmentForm.controls.studentId.invalid) {
      this.studentSelectRef()?.nativeElement.focus();
    } else if (this.enrollmentForm.controls.academicClassId.invalid) {
      this.classSelectRef()?.nativeElement.focus();
    }
  }
}
