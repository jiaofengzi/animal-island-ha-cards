import {defineConfig} from '@playwright/test';
const baseURL=`http://127.0.0.1:${process.env.ISLAND_TEST_PORT??4173}`;
const executablePath=process.env.ISLAND_CHROMIUM_PATH;
export default defineConfig({testDir:'./tests/browser',use:{baseURL,channel:executablePath||process.env.CI?undefined:'chrome',launchOptions:executablePath?{executablePath}:{},headless:true,screenshot:'only-on-failure'},webServer:{command:'npm run dev',url:baseURL,reuseExistingServer:!process.env.CI},reporter:'list'});
