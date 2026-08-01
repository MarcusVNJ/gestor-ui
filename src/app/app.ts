import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { NavigationFocus } from './core/navigation/navigation-focus';

const NAVIGATION_ITEMS = [
  { label: 'Alunos', path: '/alunos' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Disciplinas', path: '/disciplinas' },
  { label: 'Turmas', path: '/turmas' },
  { label: 'Matrículas', path: '/matriculas' },
] as const;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  protected readonly navigationItems = NAVIGATION_ITEMS;

  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly injector = inject(Injector);
  private readonly navigationFocus = inject(NavigationFocus);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly drawer = viewChild.required<ElementRef<HTMLElement>>('drawer');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly drawerOpenState = signal(false);
  private readonly desktopNavigationQuery = this.createDesktopNavigationQuery();
  private readonly handleNavigationModeChange = (): void => {
    if (this.desktopNavigationQuery?.matches) {
      const wasOpen = this.drawerOpenState();
      this.closeDrawer(false);

      if (wasOpen) {
        this.focusDesktopDestination();
      }

      return;
    }

    const activeElement = this.document.activeElement;
    if (activeElement && this.drawer().nativeElement.contains(activeElement)) {
      afterNextRender(() => this.menuButton().nativeElement.focus(), { injector: this.injector });
    }
  };

  protected readonly isDrawerOpen = this.drawerOpenState.asReadonly();

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.desktopNavigationQuery?.addEventListener('change', this.handleNavigationModeChange);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        if (!this.navigationFocus.consumeRequest()) {
          return;
        }

        this.closeDrawer(false);
        this.focusRouteHeading();
      });
  }

  ngOnDestroy(): void {
    this.desktopNavigationQuery?.removeEventListener('change', this.handleNavigationModeChange);
    this.renderer.removeClass(this.document.body, 'app-drawer-open');
  }

  protected openDrawer(): void {
    if (this.drawerOpenState()) {
      return;
    }

    this.drawerOpenState.set(true);
    this.renderer.addClass(this.document.body, 'app-drawer-open');
    afterNextRender(() => this.closeButton().nativeElement.focus(), { injector: this.injector });
  }

  protected closeDrawer(restoreFocus = true): void {
    const wasOpen = this.drawerOpenState();
    this.drawerOpenState.set(false);
    this.renderer.removeClass(this.document.body, 'app-drawer-open');

    if (wasOpen && restoreFocus) {
      afterNextRender(() => this.menuButton().nativeElement.focus(), { injector: this.injector });
    }
  }

  protected handleNavigationStart(path: string): void {
    this.closeDrawer(false);

    if (this.router.url === path) {
      this.focusRouteHeading();
      return;
    }

    this.navigationFocus.requestHeadingFocus();
  }

  protected handleDrawerKeydown(event: KeyboardEvent): void {
    if (!this.drawerOpenState()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDrawer();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      this.drawer().nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    const firstElement = focusableElements.at(0);
    const lastElement = focusableElements.at(-1);
    const activeElement = this.document.activeElement;

    if (!firstElement || !lastElement) {
      return;
    }

    if (
      event.shiftKey &&
      (activeElement === firstElement || !this.drawer().nativeElement.contains(activeElement))
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      (activeElement === lastElement || !this.drawer().nativeElement.contains(activeElement))
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private focusRouteHeading(): void {
    afterNextRender(() => this.document.querySelector<HTMLElement>('#main-content h1')?.focus(), {
      injector: this.injector,
    });
  }

  private focusDesktopDestination(): void {
    afterNextRender(
      () => {
        const destination =
          this.drawer().nativeElement.querySelector<HTMLElement>('[aria-current="page"]') ??
          this.document.querySelector<HTMLElement>('#main-content h1');
        destination?.focus();
      },
      { injector: this.injector },
    );
  }

  private createDesktopNavigationQuery(): MediaQueryList | undefined {
    const window = this.document.defaultView;
    return window && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 64rem)')
      : undefined;
  }
}
