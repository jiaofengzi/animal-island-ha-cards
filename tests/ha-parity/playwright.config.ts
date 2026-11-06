import {resolve} from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'*.spec.ts',workers:1,timeout:60000,expect:{timeout:15000},use:{baseURL:'http://127.0.0.1:8123',headless:true,trace:'off',video:'off',screenshot:'off'},reporter:[['list'],['json',{outputFile:resolve('ha-evidence/playwright.json')}]],outputDir:resolve('.ha-test-results')});
