import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['tests/beta.firestore.rules.ts']}});
