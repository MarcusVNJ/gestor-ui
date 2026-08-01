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
import { Discipline } from './disciplines-api';
import { DisciplinesViewModel } from './disciplines-viewmodel';

type FormMode = 'create' | 'edit';

export const disciplineNameValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
): ValidationErrors | null => {
  if (typeof control.value !== 'string') {
    return { required: true };
  }

  const usefulLength = control.value.trim().length;
  if (usefulLength === 0) {
    return { required: true };
  }
  if (usefulLength > 120) {
    return { maxlength: { requiredLength: 120, actualLength: usefulLength } };
  }
  return null;
};

export type DisciplineErrorDetail = {
  readonly message: string;
  readonly traceId?: string | null;
};

@Component({
  selector: 'app-disciplines-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppDialog],
  templateUrl: './disciplines-page.html',
  styleUrl: './disciplines-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DisciplinesViewModel],
})
export class DisciplinesPage implements OnInit {
  protected readonly vm = inject(DisciplinesViewModel);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formDialog = viewChild.required<AppDialog>('formDialog');
  private readonly deleteDialog = viewChild.required<AppDialog>('deleteDialog');
  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly tableRegionRef = viewChild<ElementRef<HTMLDivElement>>('tableRegion');
  private readonly formSummaryRef = viewChild<ElementRef<HTMLDivElement>>('formSummaryRef');
  private readonly nameInputRef = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingDiscipline = signal<Discipline | null>(null);
  protected readonly disciplineToDelete = signal<Discipline | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly formSummaryError = signal<DisciplineErrorDetail | null>(null);
  protected readonly deleteError = signal<DisciplineErrorDetail | null>(null);

  protected readonly disciplineForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [disciplineNameValidator],
    }),
  });

  private triggerElement: HTMLElement | null = null;

  ngOnInit(): void {
    this.vm.loadDisciplines();
    this.disciplineForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearNameApiError();
      });
  }

  protected openCreateDialog(trigger?: HTMLElement | EventTarget | null): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('create');
    this.editingDiscipline.set(null);
    this.formSummaryError.set(null);
    this.disciplineForm.reset({ name: '' });
    this.formDialog().open(this.triggerElement ?? undefined);
  }

  protected openEditDialog(
    discipline: Discipline,
    trigger?: HTMLElement | EventTarget | null,
  ): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.formMode.set('edit');
    this.editingDiscipline.set(discipline);
    this.formSummaryError.set(null);
    this.disciplineForm.setValue({ name: discipline.name });
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

    this.clearNameApiError();
    this.disciplineForm.markAllAsTouched();
    if (this.disciplineForm.invalid) {
      this.nameInputRef()?.nativeElement.focus();
      return;
    }

    const mode = this.formMode();
    const editingDiscipline = this.editingDiscipline();
    if (mode === 'edit' && editingDiscipline === null) {
      this.formSummaryError.set({
        message: 'Não foi possível identificar a disciplina selecionada.',
      });
      setTimeout(() => this.formSummaryRef()?.nativeElement.focus(), 0);
      return;
    }

    const request = { name: this.disciplineForm.controls.name.getRawValue().trim() };
    const action$ =
      mode === 'edit' && editingDiscipline !== null
        ? this.vm.editDiscipline(editingDiscipline.id, request)
        : this.vm.registerDiscipline(request);

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
    discipline: Discipline,
    trigger?: HTMLElement | EventTarget | null,
  ): void {
    this.triggerElement = trigger instanceof HTMLElement ? trigger : null;
    this.disciplineToDelete.set(discipline);
    this.deleteError.set(null);
    this.deleteDialog().open(this.triggerElement ?? undefined);
  }

  protected closeDeleteDialog(): void {
    if (!this.isDeleting()) {
      this.deleteDialog().close();
      this.disciplineToDelete.set(null);
    }
  }

  protected confirmDelete(): void {
    const discipline = this.disciplineToDelete();
    if (discipline === null || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);
    this.vm.clearNotice();

    this.vm
      .deleteDiscipline(discipline.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.deleteDialog().close(true);
          this.disciplineToDelete.set(null);
          this.scheduleFocusFallback(false);
        },
        error: (error: unknown) => {
          this.isDeleting.set(false);
          const apiError = normalizeApiError(error);
          if (apiError.status === 404) {
            this.deleteDialog().close(true);
            this.disciplineToDelete.set(null);
            this.scheduleFocusFallback(true);
            return;
          }
          let message = apiError.detail || 'Não foi possível excluir a disciplina.';
          if (apiError.kind === 'network' || apiError.status === 500) {
            message = `${message} Atualize a lista para verificar o estado real antes de tentar novamente.`;
          }
          this.deleteError.set({ message, traceId: apiError.traceId });
        },
      });
  }

  protected getNameError(): string | null {
    const control = this.disciplineForm.controls.name;
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }
    const apiError = control.errors?.['apiError'];
    if (typeof apiError === 'string') {
      return apiError;
    }
    if (control.errors?.['required']) {
      return 'Nome é obrigatório.';
    }
    if (control.errors?.['maxlength']) {
      return 'Nome deve ter no máximo 120 caracteres úteis.';
    }
    return 'Nome inválido.';
  }

  private clearNameApiError(): void {
    const control = this.disciplineForm.controls.name;
    if (!control.errors?.['apiError']) {
      return;
    }
    const { apiError: _, ...remainingErrors } = control.errors;
    control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
  }

  private handleFormApiError(error: ApiClientError): void {
    let nameViolation: string | null = null;
    const unknownViolations: string[] = [];

    for (const violation of error.violations) {
      if (violation.field === 'name' && nameViolation === null) {
        nameViolation = violation.message;
      } else if (violation.field !== 'name') {
        unknownViolations.push(violation.message);
      }
    }

    if (nameViolation !== null) {
      const control = this.disciplineForm.controls.name;
      control.setErrors({ ...control.errors, apiError: nameViolation });
      control.markAsTouched();
    }

    let summaryMessage: string | null = null;
    if (unknownViolations.length > 0) {
      summaryMessage = unknownViolations.join(' ');
    } else if (nameViolation === null) {
      summaryMessage = error.detail || 'Não foi possível salvar a disciplina. Tente novamente.';
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
        this.nameInputRef()?.nativeElement.focus();
      }
    }, 0);
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
