import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {dashboard} from './fixtures.mjs';
const dir=resolve(process.env.HA_CONFIG_DIR||'.ha-runtime');
await mkdir(`${dir}/www`,{recursive:true,mode:0o700});
for(const name of ['mushroom-original','island-ha-cards']) await copyFile(`_parity/${name}.js`,`${dir}/www/${name}.js`);
await writeFile(`${dir}/configuration.yaml`, `homeassistant:\n  name: Isolated parity laboratory\n  latitude: 0\n  longitude: 0\n  elevation: 0\n  unit_system: metric\n  time_zone: UTC\ndefault_config:\nfrontend:\napi:\nwebsocket_api:\nhttp:\nconfig:\nonboarding:\ninput_boolean:\n  parity:\n    name: Parity service target\n    initial: false\nlovelace:\n  mode: yaml\n  resources:\n    - url: /local/mushroom-original.js\n      type: module\n    - url: /local/island-ha-cards.js\n      type: module\n`);
await writeFile(`${dir}/ui-lovelace.yaml`,JSON.stringify(dashboard(),null,2));
console.log('Prepared isolated HA config (no credentials).');
