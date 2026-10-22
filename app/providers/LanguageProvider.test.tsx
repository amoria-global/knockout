import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageProvider';
import { useTranslations } from 'next-intl';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function TestConsumer() {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations('nav');
  return (
    <div>
      <span id="current-locale">{locale}</span>
      <span id="translated-events">{t('events')}</span>
      <button id="btn-rw" onClick={() => setLocale('rw')}>Switch to RW</button>
      <button id="btn-fr" onClick={() => setLocale('fr')}>Switch to FR</button>
      <button id="btn-es" onClick={() => setLocale('es')}>Switch to ES</button>
      <button id="btn-en" onClick={() => setLocale('en')}>Switch to EN</button>
      <p id="dom-text">Find a Photographer</p>
      <p id="how-it-works">How It Works</p>
      <p id="about-us">About Us</p>
      <p id="punct-text">Events:</p>
    </div>
  );
}

describe('LanguageProvider switching', () => {
  it('updates translated content and DOM when locale is switched between multiple languages', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );
    });

    const getEl = (id: string) => host.querySelector(id);

    // Initial English
    expect(getEl('#current-locale')?.textContent).toBe('en');
    expect(getEl('#translated-events')?.textContent).toBe('Events');
    expect(getEl('#dom-text')?.textContent).toBe('Find a Photographer');
    expect(getEl('#how-it-works')?.textContent).toBe('How It Works');
    expect(getEl('#about-us')?.textContent).toBe('About Us');
    expect(getEl('#punct-text')?.textContent).toBe('Events:');

    // 1. Switch to Kinyarwanda
    await act(async () => {
      (getEl('#btn-rw') as HTMLButtonElement).click();
    });

    expect(getEl('#current-locale')?.textContent).toBe('rw');
    expect(getEl('#translated-events')?.textContent).toBe('Ibirori');
    expect(getEl('#dom-text')?.textContent).toBe('Shaka umufotozi');
    expect(getEl('#how-it-works')?.textContent).toBe('Uko bikora');
    expect(getEl('#about-us')?.textContent).toBe('Ibyerekeye twebwe');
    expect(getEl('#punct-text')?.textContent).toBe('Ibirori:');

    // 2. Switch from Kinyarwanda to French
    await act(async () => {
      (getEl('#btn-fr') as HTMLButtonElement).click();
    });

    expect(getEl('#current-locale')?.textContent).toBe('fr');
    expect(getEl('#translated-events')?.textContent).toBe('Événements');
    expect(getEl('#dom-text')?.textContent).toBe('Trouver un photographe');
    expect(getEl('#how-it-works')?.textContent).toBe('Comment ça marche');
    expect(getEl('#about-us')?.textContent).toBe('À propos de nous');
    expect(getEl('#punct-text')?.textContent).toBe('Événements:');

    // 3. Switch from French to Spanish
    await act(async () => {
      (getEl('#btn-es') as HTMLButtonElement).click();
    });

    expect(getEl('#current-locale')?.textContent).toBe('es');
    expect(getEl('#translated-events')?.textContent).toBe('Eventos');
    expect(getEl('#dom-text')?.textContent).toBe('Encontrar un fotógrafo');
    expect(getEl('#how-it-works')?.textContent).toBe('Cómo funciona');
    expect(getEl('#about-us')?.textContent).toBe('Sobre nosotros');
    expect(getEl('#punct-text')?.textContent).toBe('Eventos:');

    // 4. Switch from Spanish back to English
    await act(async () => {
      (getEl('#btn-en') as HTMLButtonElement).click();
    });

    expect(getEl('#current-locale')?.textContent).toBe('en');
    expect(getEl('#translated-events')?.textContent).toBe('Events');
    expect(getEl('#dom-text')?.textContent).toBe('Find a Photographer');
    expect(getEl('#how-it-works')?.textContent).toBe('How It Works');
    expect(getEl('#about-us')?.textContent).toBe('About Us');
    expect(getEl('#punct-text')?.textContent).toBe('Events:');

    act(() => root.unmount());
    host.remove();
  });
});
