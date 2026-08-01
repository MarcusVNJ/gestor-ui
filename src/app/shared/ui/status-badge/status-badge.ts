import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusBadgeStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'CONFIRMED' | 'CANCELED';

type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgePresentation {
  readonly label: string;
  readonly tone: StatusBadgeTone;
}

const STATUS_PRESENTATIONS: Readonly<Record<StatusBadgeStatus, StatusBadgePresentation>> = {
  OPEN: { label: 'Aberta', tone: 'success' },
  CLOSED: { label: 'Fechada', tone: 'neutral' },
  PENDING: { label: 'Pendente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmada', tone: 'success' },
  CANCELED: { label: 'Cancelada', tone: 'danger' },
};

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="cssClass()">{{ presentation().label }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<StatusBadgeStatus>();
  protected readonly presentation = computed(() => STATUS_PRESENTATIONS[this.status()]);
  protected readonly cssClass = computed(() => `ui-badge ui-badge--${this.presentation().tone}`);
}
