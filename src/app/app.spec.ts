import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { App } from './app';
import { appConfig } from './app.config';

const NAVIGATION_LABELS = ['Alunos', 'Cursos', 'Disciplinas', 'Turmas', 'Matrículas'];
const FEATURE_ROUTES = [
  ['/alunos', 'Alunos'],
  ['/cursos', 'Cursos'],
  ['/disciplinas', 'Disciplinas'],
  ['/turmas', 'Turmas'],
  ['/matriculas', 'Matrículas'],
] as const;

describe('Application shell and routing', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    });
  });

  it('renders the skip link and all primary navigation destinations', async () => {
    const fixture = await renderApplication('/alunos');
    const root = fixture.nativeElement as HTMLElement;
    const skipLink = requiredElement<HTMLAnchorElement>(root, '.skip-link');
    const navigationLinks = [...root.querySelectorAll<HTMLAnchorElement>('.navigation-link')];

    expect(skipLink.textContent?.trim()).toBe('Ir para o conteúdo');
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(navigationLinks.map((link) => link.textContent?.trim())).toEqual(NAVIGATION_LABELS);
    expect(navigationLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/alunos',
      '/cursos',
      '/disciplinas',
      '/turmas',
      '/matriculas',
    ]);
  });

  it('redirects the initial route to Alunos and marks it as the current page', async () => {
    const fixture = await renderApplication('/');
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;
    const currentLink = requiredElement<HTMLAnchorElement>(
      root,
      '.navigation-link[aria-current="page"]',
    );

    expect(router.url).toBe('/alunos');
    expect(currentLink.textContent?.trim()).toBe('Alunos');
    expect(currentLink.classList.contains('navigation-link--active')).toBe(true);
    expect(document.title).toBe('Alunos | Gestor acadêmico');
  });

  it.each(FEATURE_ROUTES)('loads %s directly inside the shell', async (path, headingText) => {
    const fixture = await renderApplication(path);
    const root = fixture.nativeElement as HTMLElement;
    const heading = requiredElement<HTMLHeadingElement>(root, '#main-content h1');
    const currentLink = requiredElement<HTMLAnchorElement>(
      root,
      '.navigation-link[aria-current="page"]',
    );

    expect(heading.textContent?.trim()).toBe(headingText);
    expect(currentLink.textContent?.trim()).toBe(headingText);
    expect(document.title).toBe(`${headingText} | Gestor acadêmico`);
  });

  it('updates the route, active item, document title and heading focus after navigation', async () => {
    const fixture = await renderApplication('/alunos');
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;
    const classesLink = findLink(root, 'Turmas');

    classesLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const heading = requiredElement<HTMLHeadingElement>(root, '#main-content h1');
    expect(router.url).toBe('/turmas');
    expect(classesLink.getAttribute('aria-current')).toBe('page');
    expect(document.title).toBe('Turmas | Gestor acadêmico');
    expect(heading.textContent?.trim()).toBe('Turmas');
    expect(document.activeElement).toBe(heading);
  });

  it('shows the internal 404 page with a safe return link', async () => {
    const fixture = await renderApplication('/rota-inexistente');
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;
    const heading = requiredElement<HTMLHeadingElement>(root, '#main-content h1');
    const returnLink = findLink(root, 'Ir para Alunos');

    expect(heading.textContent?.trim()).toBe('Página não encontrada');
    expect(returnLink.getAttribute('href')).toBe('/alunos');
    expect(document.title).toBe('Página não encontrada | Gestor acadêmico');

    returnLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const studentsHeading = requiredElement<HTMLHeadingElement>(root, '#main-content h1');
    expect(router.url).toBe('/alunos');
    expect(document.activeElement).toBe(studentsHeading);
  });

  it('opens the drawer, makes the background inert and moves focus inside it', async () => {
    const fixture = await renderApplication('/alunos');
    const root = fixture.nativeElement as HTMLElement;
    const menuButton = requiredElement<HTMLButtonElement>(root, '.menu-button');
    const drawer = requiredElement<HTMLElement>(root, '.navigation-panel');
    const closeButton = requiredElement<HTMLButtonElement>(drawer, '.drawer-close-button');

    menuButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.classList.contains('navigation-panel--open')).toBe(true);
    expect(requiredElement(root, '.app-header').hasAttribute('inert')).toBe(true);
    expect(requiredElement(root, '#main-content').hasAttribute('inert')).toBe(true);
    expect(document.body.classList.contains('app-drawer-open')).toBe(true);
    expect(document.activeElement).toBe(closeButton);
  });

  it('keeps Tab focus in the drawer and closes it with Escape while restoring focus', async () => {
    const fixture = await renderApplication('/alunos');
    const root = fixture.nativeElement as HTMLElement;
    const menuButton = requiredElement<HTMLButtonElement>(root, '.menu-button');
    const drawer = requiredElement<HTMLElement>(root, '.navigation-panel');
    const closeButton = requiredElement<HTMLButtonElement>(drawer, '.drawer-close-button');
    const navigationLinks = [...drawer.querySelectorAll<HTMLAnchorElement>('.navigation-link')];
    const lastLink = navigationLinks.at(-1);

    if (!lastLink) {
      throw new Error('Expected at least one navigation link');
    }

    menuButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    closeButton.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(document.activeElement).toBe(lastLink);

    lastLink.focus();
    lastLink.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );

    expect(document.activeElement).toBe(closeButton);

    drawer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.classList.contains('navigation-panel--open')).toBe(false);
    expect(document.body.classList.contains('app-drawer-open')).toBe(false);
    expect(document.activeElement).toBe(menuButton);
  });

  it('releases the modal drawer state when the navigation changes to desktop mode', async () => {
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const desktopNavigationQuery = new ControllableMediaQueryList('(min-width: 64rem)');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => desktopNavigationQuery),
    });

    try {
      const fixture = await renderApplication('/alunos');
      const root = fixture.nativeElement as HTMLElement;
      const menuButton = requiredElement<HTMLButtonElement>(root, '.menu-button');
      const currentLink = findLink(root, 'Alunos');

      menuButton.click();
      fixture.detectChanges();
      await fixture.whenStable();

      desktopNavigationQuery.setMatches(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
      expect(requiredElement(root, '.app-header').hasAttribute('inert')).toBe(false);
      expect(requiredElement(root, '#main-content').hasAttribute('inert')).toBe(false);
      expect(document.body.classList.contains('app-drawer-open')).toBe(false);
      expect(document.activeElement).toBe(currentLink);
    } finally {
      if (originalMatchMedia) {
        Object.defineProperty(window, 'matchMedia', originalMatchMedia);
      } else {
        Reflect.deleteProperty(window, 'matchMedia');
      }
    }
  });

  it('moves focus to the 404 heading when an open drawer changes to desktop mode', async () => {
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const desktopNavigationQuery = new ControllableMediaQueryList('(min-width: 64rem)');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => desktopNavigationQuery),
    });

    try {
      const fixture = await renderApplication('/rota-inexistente');
      const root = fixture.nativeElement as HTMLElement;
      const menuButton = requiredElement<HTMLButtonElement>(root, '.menu-button');
      const heading = requiredElement<HTMLHeadingElement>(root, '#main-content h1');

      menuButton.click();
      fixture.detectChanges();
      await fixture.whenStable();

      desktopNavigationQuery.setMatches(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(heading);
    } finally {
      restoreMatchMedia(originalMatchMedia);
    }
  });

  it('moves focus to the menu button when desktop navigation becomes a closed drawer', async () => {
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const desktopNavigationQuery = new ControllableMediaQueryList('(min-width: 64rem)', true);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => desktopNavigationQuery),
    });

    try {
      const fixture = await renderApplication('/alunos');
      const root = fixture.nativeElement as HTMLElement;
      const menuButton = requiredElement<HTMLButtonElement>(root, '.menu-button');
      const currentLink = findLink(root, 'Alunos');

      currentLink.focus();
      desktopNavigationQuery.setMatches(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(menuButton);
    } finally {
      restoreMatchMedia(originalMatchMedia);
    }
  });
});

class ControllableMediaQueryList extends EventTarget implements MediaQueryList {
  matches = false;
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null;

  constructor(
    readonly media: string,
    matches = false,
  ) {
    super();
    this.matches = matches;
  }

  addListener(): void {}

  removeListener(): void {}

  setMatches(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

function restoreMatchMedia(descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(window, 'matchMedia', descriptor);
  } else {
    Reflect.deleteProperty(window, 'matchMedia');
  }
}

async function renderApplication(path: string): Promise<ComponentFixture<App>> {
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  fixture.detectChanges();

  await router.navigateByUrl(path);
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function findLink(root: ParentNode, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll<HTMLAnchorElement>('a')].find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!link) {
    throw new Error(`Expected link with text ${text}`);
  }
  return link;
}

function requiredElement<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected test element matching ${selector}`);
  }
  return element;
}
