import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-feature-page',
  templateUrl: './feature-page.html',
  styleUrl: './feature-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePage {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
}
