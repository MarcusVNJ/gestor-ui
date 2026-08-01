import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

let nextDialogId = 0;

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialog {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly busy = input(false);

  protected readonly titleId = `app-dialog-title-${++nextDialogId}`;
  protected readonly descriptionId = `app-dialog-description-${nextDialogId}`;

  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private returnFocusTarget: HTMLElement | undefined;

  open(trigger?: HTMLElement): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      return;
    }

    const activeElement = this.document.activeElement;
    const htmlElementConstructor = this.document.defaultView?.HTMLElement;
    this.returnFocusTarget =
      trigger ??
      (htmlElementConstructor && activeElement instanceof htmlElementConstructor
        ? activeElement
        : undefined);
    dialog.showModal();
  }

  close(): void {
    const dialog = this.dialog().nativeElement;
    if (!this.busy() && dialog.open) {
      dialog.close();
    }
  }

  protected handleCancel(event: Event): void {
    if (this.busy()) {
      event.preventDefault();
    }
  }

  protected restoreFocus(): void {
    this.returnFocusTarget?.focus();
    this.returnFocusTarget = undefined;
  }
}
