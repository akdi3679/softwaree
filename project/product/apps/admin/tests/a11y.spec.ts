import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y - Admin pages', () => {
  for (const page of ['/', '/projects', '/users', '/audit', '/modules', '/backup']) {
    test(`${page} has no critical a11y issues`, async ({ page: p }) => {
      await p.goto(page);
      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });
  }
});