#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const playwright = await import('playwright').catch(() => null);

if (!playwright) {
    console.error('Playwright is required for lottery screenshots. Install it with: npm i -D playwright');
    process.exit(1);
}

const { chromium } = playwright;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = (process.env.LOTTERY_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const outputDir = path.resolve(rootDir, process.env.LOTTERY_SCREENSHOT_DIR || 'artifacts/lottery-screenshots');
const storageState = process.env.LOTTERY_SCREENSHOT_AUTH_FILE || undefined;

const routes = [
    { name: 'lobby', path: '/lottery' },
    { name: 'shop', path: '/lottery?view=shop' },
    { name: 'room', path: '/lottery?view=room' },
];

const viewports = [
    { name: 'mobile', width: 390, height: 844, isMobile: true },
    { name: 'tablet', width: 768, height: 1024, isMobile: true },
    { name: 'desktop', width: 1440, height: 1000, isMobile: false },
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

try {
    for (const viewport of viewports) {
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: viewport.isMobile ? 2 : 1,
            isMobile: viewport.isMobile,
            hasTouch: viewport.isMobile,
            storageState,
        });

        for (const route of routes) {
            const page = await context.newPage();
            page.setDefaultTimeout(25_000);
            const url = `${baseUrl}${route.path}`;
            console.log(`Capturing ${route.name} at ${viewport.name}: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle' });
            await page.screenshot({
                path: path.join(outputDir, `${route.name}-${viewport.name}.png`),
                fullPage: true,
            });
            await page.close();
        }

        await context.close();
    }
} finally {
    await browser.close();
}

console.log(`Lottery screenshots saved to ${outputDir}`);
