# Family Tree Visualizer - E2E Testing

This directory contains comprehensive end-to-end tests for the Family Tree Visualizer application using Playwright.

## Test Structure

### Test Files

- `family-tree.spec.ts` - Main E2E test suite covering all major functionality
- `prd-section6-edge-cases.spec.ts` - Specific tests for PRD Section 6 edge cases
- `utils/test-helpers.ts` - Reusable test helper functions
- `TESTING_CHECKLIST.md` - Comprehensive manual testing checklist

### Test Categories

1. **Family Tree Rendering** - Tree display, zoom, pan, view modes
2. **Member Management** - Add, edit, delete family members
3. **Relationship Management** - Parent, child, spouse relationships
4. **Validation & Edge Cases** - Data validation, business logic
5. **Undo/Redo Functionality** - History management
6. **Import/Export** - File handling
7. **Localization & RTL** - Language switching, RTL support
8. **Accessibility** - Keyboard navigation, screen readers
9. **Performance** - Large trees, memory usage
10. **Cross-Browser Compatibility** - Multiple browsers
11. **Mobile Responsiveness** - Mobile devices

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Test Commands

#### Run All Tests
```bash
npm run test:e2e
```

#### Run Tests with UI (Interactive)
```bash
npm run test:e2e:ui
```

#### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

#### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

#### Run Specific Test File
```bash
npx playwright test family-tree.spec.ts
```

#### Run Specific Test Suite
```bash
npx playwright test --grep "Member Management"
```

#### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
```

#### Run Tests on Mobile
```bash
npx playwright test --project="Mobile Chrome"
```

### View Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

## Test Data Requirements

The tests expect the following data-testid attributes in your components:

### Core Elements
- `[data-testid="family-tree"]` - Main tree container
- `[data-testid="node-card"]` - Individual family member cards
- `[data-testid="navbar"]` - Navigation bar

### Navigation
- `[data-testid="tree-editor-link"]` - Link to tree editor
- `[data-testid="mobile-menu-btn"]` - Mobile menu button
- `[data-testid="mobile-menu"]` - Mobile menu

### Forms
- `[data-testid="add-member-btn"]` - Add member button
- `[data-testid="name-input"]` - Name input field
- `[data-testid="birth-date-input"]` - Birth date input
- `[data-testid="gender-select"]` - Gender select dropdown
- `[data-testid="submit-btn"]` - Form submit button

### Actions
- `[data-testid="edit-member-btn"]` - Edit member button
- `[data-testid="delete-member-btn"]` - Delete member button
- `[data-testid="confirm-delete-btn"]` - Confirm deletion button
- `[data-testid="add-parent-btn"]` - Add parent button
- `[data-testid="add-child-btn"]` - Add child button
- `[data-testid="add-spouse-btn"]` - Add spouse button

### Notifications
- `[data-testid="success-notification"]` - Success notification
- `[data-testid="error-notification"]` - Error notification

### Settings
- `[data-testid="theme-toggle"]` - Theme toggle button
- `[data-testid="language-toggle"]` - Language toggle button
- `[data-testid="english-option"]` - English language option
- `[data-testid="arabic-option"]` - Arabic language option

### Export/Import
- `[data-testid="export-btn"]` - Export button
- `[data-testid="export-png-btn"]` - Export PNG button
- `[data-testid="export-pdf-btn"]` - Export PDF button
- `[data-testid="import-btn"]` - Import button
- `[data-testid="file-input"]` - File input for import

### Undo/Redo
- `[data-testid="undo-btn"]` - Undo button
- `[data-testid="redo-btn"]` - Redo button

## Adding New Tests

### 1. Create Test File
Create a new `.spec.ts` file in the `tests/e2e/` directory.

### 2. Use Test Helpers
Import and use the test helpers for common operations:

```typescript
import { createTestHelpers } from './utils/test-helpers';

test.describe('My New Feature', () => {
  let helpers: ReturnType<typeof createTestHelpers>;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = createTestHelpers(page);
  });

  test('should do something', async ({ page }) => {
    await helpers.addFamilyMember('Test Member', '1990-01-01', 'male');
    await helpers.expectMemberVisible('Test Member');
  });
});
```

### 3. Follow Naming Conventions
- Use descriptive test names starting with "should"
- Group related tests in `test.describe` blocks
- Use consistent data-testid attributes

### 4. Add to Checklist
Update `TESTING_CHECKLIST.md` with new test scenarios.

## Debugging Tests

### 1. Debug Mode
Run tests in debug mode to step through:
```bash
npm run test:e2e:debug
```

### 2. UI Mode
Use Playwright UI for interactive debugging:
```bash
npm run test:e2e:ui
```

### 3. Screenshots and Videos
Tests automatically capture screenshots and videos on failure. Check the `test-results/` directory.

### 4. Console Logs
Add console logs in your tests:
```typescript
test('debug test', async ({ page }) => {
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'debug.png' });
});
```

## Continuous Integration

### GitHub Actions
Add this to your `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `test.beforeEach` for setup
- Clean up after tests if needed

### 2. Reliable Selectors
- Use `data-testid` attributes for test selectors
- Avoid using text content or CSS classes that might change
- Make selectors specific and unique

### 3. Wait Strategies
- Use explicit waits for dynamic content
- Wait for network requests to complete
- Use `page.waitForSelector()` for elements that appear after actions

### 4. Error Handling
- Test both success and error scenarios
- Verify error messages are displayed correctly
- Test edge cases and invalid inputs

### 5. Performance
- Keep tests fast and efficient
- Avoid unnecessary waits
- Use appropriate timeouts

## Troubleshooting

### Common Issues

1. **Tests failing intermittently**
   - Add explicit waits
   - Check for race conditions
   - Use `page.waitForLoadState()`

2. **Selectors not found**
   - Verify data-testid attributes exist
   - Check if elements are in shadow DOM
   - Use `page.locator().isVisible()` to debug

3. **Tests slow**
   - Optimize selectors
   - Reduce unnecessary waits
   - Use `page.waitForLoadState('networkidle')`

4. **Browser compatibility issues**
   - Test on multiple browsers
   - Check for browser-specific CSS/JS
   - Use browser-specific test configurations

### Getting Help

1. Check Playwright documentation: https://playwright.dev/
2. Review test logs and screenshots
3. Use Playwright UI for interactive debugging
4. Check browser console for errors 