import { makeAutoObservable } from 'mobx';

export type Theme = 'light' | 'dark';

export class ThemeStore {
  theme: Theme = 'light';

  constructor() {
    makeAutoObservable(this);
    this.loadTheme();
  }

  private loadTheme() {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      this.theme = saved;
    }
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }
}
