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
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { ApiClientError, normalizeApiError } from '../../core/api/api-error';
import { AppDialog } from '../../shared/ui/app-dialog/app-dialog';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { AcademicClass, OpeningStatus } from './academic-classes-api';
import { AcademicClassesViewModel } from './academic-classes-viewmodel';

type FormMode = 'create' | 'edit';

export const openingStatusValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
): ValidationErrors | null => {
  const value = control.value;
  if (value !== 'OPEN' && value !== 'CLOSED') {
    return { invalidOpeningStatus: true };
  }
  return null;
};

export const seatLimitValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return { required: true };
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return { invalidSeatLimit: true };
  }
  if (!Number.isInteger(num)) {
    return { decimalSeatLimit: true };
  }
  if (num < 1) {
    return { minSeatLimit: true };
  }
  return null;
};

@Component({
  selector: 'app-academic-classes-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppDialog, StatusBadge],
  templateUrl: './academic-classes-page.html',
  styleUrl: './academic-classes-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AcademicClassesViewModel],
})
export class AcademicClassesPage implements OnInit {
  protected readonly vm = inject(AcademicClassesViewModel);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly deleteDialog = viewChild.required<AppDialog>('deleteDialog');
  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly tableRegionRef = viewChild<ElementRef<HTMLDivElement>>('tableRegion');

  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingClass = signal<AcademicClass | null>(null);
  protected readonly classToDelete = signal<AcademicClass | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly formSummaryError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly academicClassForm = new FormGroup({
    openingStatus: new FormControl<OpeningStatus>('OPEN', {
      nonNullable: true,
      validators: [openingStatusValidator],
    }),
    seatLimit: new FormControl<number | null>(null, {
      validators: [seatLimitValidator],
    }),
  });

  private triggerElement: HTMLElement | null = null;

  ngOnInit(): void {
    this.vm.loadAcademicClasses();
  }

  protected openCreateDialog(trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('create');
    this.editingClass.set(null);
    this.formSummaryError.set(null);
    this.academicClassForm.reset({ openingStatus: 'OPEN', seatLimit: null });
    this.formDialog().open(this.triggerElement ?? undefined);
  }

  protected openEditDialog(
    academicClass: AcademicClass,
    trigger?: HTMLElement | EventTarget | null,
  ): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('edit');
    this.editingClass.set(academicClass);
    this.formSummaryError.set(null);
    this.academicClassForm.setValue({
      openingStatus: academicClass.openingStatus,
      seatLimit: academicClass.seatLimit,
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
    this.academicClassForm.markAllAsTouched();
    if (this.academicClassForm.invalid) {
      return;
    }

    const mode = this.formMode();
    const editingClass = this.editingClass();
    if (mode === 'edit' && editingClass === null) {
      this.formSummaryError.set('Não foi possível identificar a turma selecionada.');
      return;
    }

    const rawSeatLimit = this.academicClassForm.controls.seatLimit.value;
    const seatLimitNum = typeof rawSeatLimit === 'number' ? rawSeatLimit : Number(rawSeatLimit);

    const request = {
      openingStatus: this.academicClassForm.controls.openingStatus.value,
      seatLimit: seatLimitNum,
    };

    const action$ =
      mode === 'edit' && editingClass !== null
        ? this.vm.editAcademicClass(editingClass.id, request)
        : this.vm.registerAcademicClass(request);

    this.isSubmitting.set(true);
    this.formSummaryError.set(null);
    this.vm.clearNotice();

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
          this.scheduleFocusFallback(true);
          return;
        }
        this.handleFormApiError(apiError);
      },
    });
  }

  protected openDeleteDialog(
    academicClass: AcademicClass,
    trigger?: HTMLElement | EventTarget | null,
  ): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.classToDelete.set(academicClass);
    this.deleteError.set(null);
    this.deleteDialog().open(this.triggerElement ?? undefined);
  }

  protected closeDeleteDialog(): void {
    if (!this.isDeleting()) {
      this.deleteDialog().close();
      this.classToDelete.set(null);
    }
  }

  protected confirmDelete(): void {
    const academicClass = this.classToDelete();
    if (academicClass === null || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);
    this.vm.clearNotice();

    this.vm
      .deleteAcademicClass(academicClass.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.deleteDialog().close();
          this.classToDelete.set(null);
          this.scheduleFocusFallback(false);
        },
        error: (error: unknown) => {
          this.isDeleting.set(false);
          const apiError = normalizeApiError(error);
          if (apiError.status === 404) {
            this.deleteDialog().close();
            this.classToDelete.set(null);
            this.scheduleFocusFallback(true);
            return;
          }
          this.deleteError.set(apiError.detail || 'Não foi possível excluir a turma.');
        },
      });
  }

  protected getOpeningStatusError(): string | null {
    const control = this.academicClassForm.controls.openingStatus;
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }
    const apiError = control.errors?.['apiError'];
    if (typeof apiError === 'string') {
      return apiError;
    }
    return 'Selecione uma situação válida.';
  }

  protected getSeatLimitError(): string | null {
    const control = this.academicClassForm.controls.seatLimit;
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }
    const apiError = control.errors?.['apiError'];
    if (typeof apiError === 'string') {
      return apiError;
    }
    if (control.errors?.['required']) {
      return 'Limite de vagas é obrigatório.';
    }
    if (control.errors?.['decimalSeatLimit']) {
      return 'O limite de vagas deve ser um número inteiro.';
    }
    if (control.errors?.['minSeatLimit']) {
      return 'O limite de vagas deve ser no mínimo 1.';
    }
    return 'Informe um limite de vagas válido.';
  }

  private clearApiErrors(): void {
    for (const control of [
      this.academicClassForm.controls.openingStatus,
      this.academicClassForm.controls.seatLimit,
    ]) {
      if (control.errors?.['apiError']) {
        const { apiError: _, ...remainingErrors } = control.errors;
        control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
      }
    }
  }

  private handleFormApiError(error: ApiClientError): void {
    let statusViolation: string | null = null;
    let seatLimitViolation: string | null = null;
    const unknownViolations: string[] = [];

    for (const violation of error.violations) {
      if (violation.field === 'openingStatus' && statusViolation === null) {
        statusViolation = violation.message;
      } else if (violation.field === 'seatLimit' && seatLimitViolation === null) {
        seatLimitViolation = violation.message;
      } else {
        unknownViolations.push(violation.message);
      }
    }

    if (statusViolation !== null) {
      const control = this.academicClassForm.controls.openingStatus;
      control.setErrors({ ...control.errors, apiError: statusViolation });
      control.markAsTouched();
    }

    if (seatLimitViolation !== null) {
      const control = this.academicClassForm.controls.seatLimit;
      control.setErrors({ ...control.errors, apiError: seatLimitViolation });
      control.markAsTouched();
    }

    if (unknownViolations.length > 0) {
      this.formSummaryError.set(unknownViolations.join(' '));
    } else if (statusViolation === null && seatLimitViolation === null) {
      this.formSummaryError.set(
        error.detail || 'Não foi possível salvar a turma. Tente novamente.',
      );
    }
  }

  private scheduleFocusFallback(always: boolean): void {
    setTimeout(() => {
      if (always || (this.triggerElement && !document.body.contains(this.triggerElement))) {
        this.focusHeadingOrTable();
      }
    }, 0);
  }

  private focusHeadingOrTable(): void {
    const tableRegion = this.tableRegionRef()?.nativeElement;
    if (tableRegion && this.vm.itemCount() > 0) {
      tableRegion.focus();
      return;
    }
    this.headingRef()?.nativeElement.focus();
  }
}
