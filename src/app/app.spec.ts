import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { App } from './app';
import { appConfig } from './app.config';

describe('Application routing', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    });
  });

  it('connects the application shell to the configured home route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Aplicação carregada com sucesso',
    );
  });

  it('renders the load confirmation on the home route', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Aplicação carregada com sucesso',
    );
  });

  it('keeps the prepared feature routes predictable until their screens exist', async () => {
    const router = TestBed.inject(Router);
    const harness = await RouterTestingHarness.create('/');
    const featurePaths = ['alunos', 'cursos', 'disciplinas', 'turmas', 'matriculas'];

    for (const path of featurePaths) {
      await harness.navigateByUrl(`/${path}`);

      expect(router.url).toBe('/');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
        'Aplicação carregada com sucesso',
      );
    }
  });

  it('redirects an unknown URL to the home route', async () => {
    const router = TestBed.inject(Router);
    const harness = await RouterTestingHarness.create('/rota-inexistente');

    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Aplicação carregada com sucesso',
    );
  });
});
