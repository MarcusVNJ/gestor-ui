import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavigationFocus {
  private headingFocusRequested = false;

  requestHeadingFocus(): void {
    this.headingFocusRequested = true;
  }

  consumeRequest(): boolean {
    const request = this.headingFocusRequested;
    this.headingFocusRequested = false;
    return request;
  }
}
