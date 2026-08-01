import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavigationFocus } from '../../core/navigation/navigation-focus';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  private readonly navigationFocus = inject(NavigationFocus);

  protected requestHeadingFocus(): void {
    this.navigationFocus.requestHeadingFocus();
  }
}
