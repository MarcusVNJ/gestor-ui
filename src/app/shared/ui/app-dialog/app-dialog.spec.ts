import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AppDialog } from './app-dialog';

@Component({
  imports: [AppDialog],
  template: `
    <button #trigger type="button">Abrir diálogo</button>
    <app-dialog title="Excluir turma?" description="Esta ação não pode ser desfeita.">
      <p>Revise os dados antes de continuar.</p>
      <button dialog-actions type="button" autofocus>Cancelar</button>
    </app-dialog>
  `,
})
class DialogTestHost {}

describe('AppDialog', () => {
  it('opens as a modal with an accessible title and description', () => {
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(AppDialog)).injector.get(AppDialog);
    const host = fixture.nativeElement as HTMLElement;
    const dialog = requiredElement<HTMLDialogElement>(host, 'dialog');
    mockDialogMethods(dialog);

    component.open();

    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.getAttribute('aria-labelledby')).toBe(
      requiredElement<HTMLHeadingElement>(host, 'h2').id,
    );
    expect(dialog.getAttribute('aria-describedby')).toBe(
      requiredElement<HTMLElement>(host, '.ui-dialog__description').id,
    );
  });

  it('prevents Escape and programmatic closing while an operation is busy', () => {
    const fixture = TestBed.createComponent(AppDialog);
    fixture.componentRef.setInput('title', 'Salvando dados');
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    const dialog = requiredElement<HTMLDialogElement>(fixture.nativeElement, 'dialog');
    mockDialogMethods(dialog, true);

    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    fixture.componentInstance.close();

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog.close).not.toHaveBeenCalled();
    expect(dialog.getAttribute('aria-busy')).toBe('true');
  });

  it('restores focus to the opening control after closing', () => {
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(AppDialog)).injector.get(AppDialog);
    const host = fixture.nativeElement as HTMLElement;
    const trigger = requiredElement<HTMLButtonElement>(host, 'button');
    const dialog = requiredElement<HTMLDialogElement>(host, 'dialog');
    mockDialogMethods(dialog);
    const focus = vi.spyOn(trigger, 'focus');

    component.open(trigger);
    component.close();
    dialog.dispatchEvent(new Event('close'));

    expect(dialog.close).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
  });
});

function mockDialogMethods(dialog: HTMLDialogElement, initiallyOpen = false): void {
  let open = initiallyOpen;
  Object.defineProperty(dialog, 'open', {
    configurable: true,
    get: () => open,
  });
  dialog.showModal = vi.fn(() => {
    open = true;
  });
  dialog.close = vi.fn(() => {
    open = false;
  });
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected test element matching ${selector}`);
  }
  return element;
}
