import { DOCUMENT } from '@angular/common';
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
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { AcademicClass } from '../academic-classes/academic-classes-api';
import { Student } from '../students/students-api';
import { Enrollment } from './enrollments-api';
import { EnrollmentsViewModel, QueryAxis } from './enrollments-viewmodel';

export type EnrollmentErrorDetail = {
  readonly message: string;
  readonly traceId?: string | null;
};

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
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly cancelDialog = viewChild.required<AppDialog>('cancelDialog');

  private readonly studentSelectRef = viewChild<ElementRef<HTMLSelectElement>>('studentSelect');
  private readonly classSelectRef = viewChild<ElementRef<HTMLSelectElement>>('classSelect');
  private readonly formSummaryRef = viewChild<ElementRef<HTMLDivElement>>('formSummaryRef');

  private readonly queryStudentSelectRef =
    viewChild<ElementRef<HTMLSelectElement>>('queryStudentSelect');
  private readonly queryClassSelectRef =
    viewChild<ElementRef<HTMLSelectElement>>('queryClassSelect');

  protected readonly isSubmitting = signal(false);
  protected readonly formSummaryError = signal<EnrollmentErrorDetail | null>(null);
  protected readonly createdEnrollment = signal<Enrollment | null>(null);
  protected readonly createdStudent = signal<Student | null>(null);
  protected readonly createdClass = signal<AcademicClass | null>(null);

  protected readonly pendingTransitionId = signal<string | null>(null);
  protected readonly transitionFeedback = signal<{
    type: 'success' | 'error';
    message: string;
    traceId?: string | null;
  } | null>(null);
  protected readonly liveAnnouncement = signal<string>('');

  protected readonly cancelDialogEnrollment = signal<Enrollment | null>(null);
  protected readonly cancelDialogStudent = signal<Student | null>(null);
  protected readonly cancelError = signal<EnrollmentErrorDetail | null>(null);
  protected readonly isSubmittingCancel = signal(false);

  private triggerElement: HTMLElement | null = null;
  private cancelTriggerElement: HTMLElement | null = null;

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
    this.enrollmentForm.controls.studentId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearControlApiError(this.enrollmentForm.controls.studentId));
    this.enrollmentForm.controls.academicClassId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearControlApiError(this.enrollmentForm.controls.academicClassId));
  }

  protected onAxisChange(axis: QueryAxis): void {
    this.clearTransitionFeedback();
    this.vm.setQueryAxis(axis);
    setTimeout(() => {
      if (axis === 'student') {
        this.queryStudentSelectRef()?.nativeElement.focus();
      } else if (axis === 'class') {
        this.queryClassSelectRef()?.nativeElement.focus();
      }
    }, 0);
  }

  protected onStudentSelect(event: Event): void {
    this.clearTransitionFeedback();
    const select = event.target as HTMLSelectElement;
    this.vm.selectStudent(select.value);
  }

  protected onClassSelect(event: Event): void {
    this.clearTransitionFeedback();
    const select = event.target as HTMLSelectElement;
    this.vm.selectClass(select.value);
  }

  protected openCreateDialog(trigger?: HTMLElement | EventTarget | null): void {
    this.clearTransitionFeedback();
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

    this.vm
      .enrollStudent({ studentId, academicClassId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (enrollment) => {
          this.isSubmitting.set(false);
          this.createdEnrollment.set(enrollment);

          const foundStudent = this.vm.students().find((s) => s.id === studentId) ?? null;
          const foundClass =
            this.vm.academicClasses().find((c) => c.id === academicClassId) ?? null;

          this.createdStudent.set(foundStudent);
          this.createdClass.set(foundClass);

          this.vm.retryQuery();
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          const apiError = normalizeApiError(error);
          this.handleFormApiError(apiError);
        },
      });
  }

  protected confirmEnrollment(enrollment: Enrollment, trigger?: EventTarget | null): void {
    if (this.pendingTransitionId()) {
      return;
    }

    this.pendingTransitionId.set(enrollment.id);
    this.clearTransitionFeedback();

    this.vm
      .confirmEnrollment(enrollment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingTransitionId.set(null);
          this.transitionFeedback.set({
            type: 'success',
            message: 'Matrícula confirmada com sucesso.',
          });
          this.liveAnnouncement.set('Matrícula confirmada');

          setTimeout(() => {
            const cancelBtn = this.document.getElementById(`cancel-btn-${enrollment.id}`);
            if (cancelBtn) {
              cancelBtn.focus();
            } else {
              const rowIdEl = this.document.getElementById(`enrollment-id-${enrollment.id}`);
              rowIdEl?.focus();
            }
          }, 0);
        },
        error: (error: unknown) => {
          this.pendingTransitionId.set(null);
          const apiError = normalizeApiError(error);
          this.handleTransitionApiError('confirmation', apiError);
        },
      });
  }

  protected openCancelDialog(enrollment: Enrollment, trigger?: EventTarget | null): void {
    if (this.pendingTransitionId()) {
      return;
    }

    this.cancelTriggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.cancelDialogEnrollment.set(enrollment);

    const foundStudent = this.vm.getStudentById(enrollment.studentId) ?? null;
    this.cancelDialogStudent.set(foundStudent);
    this.cancelError.set(null);

    this.cancelDialog().open(this.cancelTriggerElement ?? undefined);
  }

  protected closeCancelDialog(): void {
    if (!this.isSubmittingCancel()) {
      this.cancelDialog().close();
    }
  }

  protected submitCancel(): void {
    const enrollment = this.cancelDialogEnrollment();
    if (!enrollment || this.isSubmittingCancel()) {
      return;
    }

    this.isSubmittingCancel.set(true);
    this.pendingTransitionId.set(enrollment.id);
    this.cancelError.set(null);
    this.clearTransitionFeedback();

    this.vm
      .cancelEnrollment(enrollment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmittingCancel.set(false);
          this.pendingTransitionId.set(null);
          this.cancelDialog().close(true);

          this.transitionFeedback.set({
            type: 'success',
            message: 'Matrícula cancelada com sucesso.',
          });
          this.liveAnnouncement.set('Matrícula cancelada');

          setTimeout(() => {
            const rowIdEl = this.document.getElementById(`enrollment-id-${enrollment.id}`);
            rowIdEl?.focus();
          }, 0);
        },
        error: (error: unknown) => {
          this.isSubmittingCancel.set(false);
          this.pendingTransitionId.set(null);
          const apiError = normalizeApiError(error);

          this.cancelDialog().close(true);
          this.handleTransitionApiError('cancellation', apiError);
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

  private clearTransitionFeedback(): void {
    this.transitionFeedback.set(null);
    this.liveAnnouncement.set('');
  }

  private clearControlApiError(control: AbstractControl): void {
    if (!control.errors?.['apiError']) {
      return;
    }
    const { apiError: _, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private clearApiErrors(): void {
    this.clearControlApiError(this.enrollmentForm.controls.studentId);
    this.clearControlApiError(this.enrollmentForm.controls.academicClassId);
  }

  private isCapacityError(error: ApiClientError): boolean {
    if (
      error.code === 'CLASS_FULL' ||
      error.code === 'NO_SEATS_AVAILABLE' ||
      error.code === 'ACADEMIC_CLASS_FULL'
    ) {
      return true;
    }
    const detailLower = error.detail.toLowerCase();
    return (
      detailLower.includes('vaga') ||
      detailLower.includes('lotad') ||
      detailLower.includes('capacidade') ||
      detailLower.includes('sem vaga')
    );
  }

  private handleTransitionApiError(
    action: 'confirmation' | 'cancellation',
    error: ApiClientError,
  ): void {
    if (error.status === 409) {
      if (action === 'confirmation' && this.isCapacityError(error)) {
        this.transitionFeedback.set({
          type: 'error',
          message:
            error.detail ||
            'Não há vagas disponíveis na turma para confirmar esta matrícula no momento.',
          traceId: error.traceId,
        });
      } else {
        this.transitionFeedback.set({
          type: 'error',
          message:
            error.detail ||
            'A situação desta matrícula foi alterada por outro processo. A consulta foi atualizada.',
          traceId: error.traceId,
        });
        this.vm.retryQuery();
      }
      return;
    }

    if (error.status === 404) {
      this.transitionFeedback.set({
        type: 'error',
        message:
          error.detail ||
          'A matrícula não foi encontrada e pode ter sido removida. A consulta foi atualizada.',
        traceId: error.traceId,
      });
      this.vm.retryQuery();
      return;
    }

    if (error.status === 500 || error.kind === 'network') {
      this.transitionFeedback.set({
        type: 'error',
        message:
          'Ocorreu uma falha na comunicação com o servidor. Atualize a consulta para verificar o estado real antes de tentar novamente.',
        traceId: error.traceId,
      });
      return;
    }

    this.transitionFeedback.set({
      type: 'error',
      message:
        error.detail ||
        `Não foi possível ${action === 'confirmation' ? 'confirmar' : 'cancelar'} a matrícula. Tente novamente.`,
      traceId: error.traceId,
    });
  }

  private handleFormApiError(error: ApiClientError): void {
    let studentViolation: string | null = null;
    let classViolation: string | null = null;
    const unknownViolations: string[] = [];

    for (const violation of error.violations) {
      if (violation.field === 'studentId' && studentViolation === null) {
        studentViolation = violation.message;
      } else if (violation.field === 'academicClassId' && classViolation === null) {
        classViolation = violation.message;
      } else {
        unknownViolations.push(violation.message);
      }
    }

    if (studentViolation !== null) {
      const control = this.enrollmentForm.controls.studentId;
      control.setErrors({ ...control.errors, apiError: studentViolation });
      control.markAsTouched();
    }

    if (classViolation !== null) {
      const control = this.enrollmentForm.controls.academicClassId;
      control.setErrors({ ...control.errors, apiError: classViolation });
      control.markAsTouched();
    }

    let summaryMessage: string | null = null;
    if (unknownViolations.length > 0) {
      summaryMessage = unknownViolations.join(' ');
    } else if (studentViolation === null && classViolation === null) {
      if (error.status === 409) {
        summaryMessage =
          error.detail || 'Matrícula duplicada: este aluno já está matriculado nesta turma.';
      } else if (error.status === 400) {
        summaryMessage =
          error.detail ||
          'A turma selecionada está fechada ou indisponível. A lista de turmas foi atualizada.';
      } else if (error.status === 404) {
        summaryMessage =
          error.detail ||
          'O aluno ou a turma selecionada não foi encontrada. As listas foram atualizadas.';
      } else {
        summaryMessage = error.detail || 'Não foi possível realizar a matrícula. Tente novamente.';
        if (error.kind === 'network' || error.status === 500) {
          summaryMessage = `${summaryMessage} Atualize a consulta para verificar o estado real antes de tentar novamente.`;
        }
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
    if (this.enrollmentForm.controls.studentId.invalid) {
      this.studentSelectRef()?.nativeElement.focus();
    } else if (this.enrollmentForm.controls.academicClassId.invalid) {
      this.classSelectRef()?.nativeElement.focus();
    }
  }
}
