import { TestBed } from '@angular/core/testing';

import { StatusBadge, type StatusBadgeStatus } from './status-badge';

describe('StatusBadge', () => {
  const cases: ReadonlyArray<readonly [StatusBadgeStatus, string]> = [
    ['OPEN', 'Aberta'],
    ['CLOSED', 'Fechada'],
    ['PENDING', 'Pendente'],
    ['CONFIRMED', 'Confirmada'],
    ['CANCELED', 'Cancelada'],
  ];

  for (const [status, expectedLabel] of cases) {
    it(`presents ${status} as ${expectedLabel}`, () => {
      const fixture = TestBed.createComponent(StatusBadge);

      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent.trim()).toBe(expectedLabel);
    });
  }
});
