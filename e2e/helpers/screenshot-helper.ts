import { Page, TestInfo } from '@playwright/test';
import * as path from 'path';

export class ScreenshotHelper {
    private count = 0;
    private testInfo: TestInfo;

    constructor(testInfo: TestInfo) {
        this.testInfo = testInfo;
    }

    async capture(page: Page, name: string, options?: { programmaticCheck?: () => Promise<void> }) {
        if (options?.programmaticCheck) {
            await options.programmaticCheck();
        }

        const index = String(this.count).padStart(3, '0');
        const filename = `${index}-${name}.png`;

        // Save to test results directory or source directory?
        // User guide says: "screenshots/ in the test's directory"
        // We can derive from testInfo.file
        const testDir = path.dirname(this.testInfo.file);
        const screenshotPath = path.join(testDir, 'screenshots', filename);

        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Attach to report?
        // this.testInfo.attachments.push(...)

        this.count++;
        return filename;
    }
}

export function createScreenshotHelper(testInfo: TestInfo) {
    return new ScreenshotHelper(testInfo);
}
