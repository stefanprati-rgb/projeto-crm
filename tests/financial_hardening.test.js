import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv;
const PROJECT_ID = 'hube-crm-financial-test';

describe('Financial Hardening Security Rules', () => {
    beforeAll(async () => {
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: {
                rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
                host: 'localhost',
                port: 8080,
            },
        });
    });

    afterAll(async () => {
        await testEnv.cleanup();
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();
    });

    const setupClient = async (context) => {
        await testEnv.withSecurityRulesDisabled(async (adminContext) => {
            const db = adminContext.firestore();
            await db.doc('users/editor_user').set({ role: 'editor', allowedBases: ['BASE_A'] });
            await db.doc('users/admin_user').set({ role: 'admin' });
            await db.doc('clients/client_test').set({
                name: 'Client Test',
                database: 'BASE_A',
                createdAt: new Date(),
                createdBy: 'admin_user',
                status: 'active',
                onboarding: {
                    pipelineStatus: 'new',
                    hasBeenInvoiced: false
                }
            });
        });
    };

    it('Editor should FAIL to update hasBeenInvoiced', async () => {
        await setupClient();
        const editor = testEnv.authenticatedContext('editor_user', {
            role: 'editor',
            allowedBases: ['BASE_A']
        });

        const db = editor.firestore();
        await assertFails(db.doc('clients/client_test').update({
            'onboarding.hasBeenInvoiced': true
        }));
    });

    it('Editor should FAIL to update firstInvoiceAt', async () => {
        await setupClient();
        const editor = testEnv.authenticatedContext('editor_user', {
            role: 'editor',
            allowedBases: ['BASE_A']
        });

        const db = editor.firestore();
        await assertFails(db.doc('clients/client_test').update({
            'onboarding.firstInvoiceAt': new Date()
        }));
    });

    it('Admin should SUCCEED to update hasBeenInvoiced', async () => {
        await setupClient();
        const admin = testEnv.authenticatedContext('admin_user', {
            role: 'admin'
        });

        const db = admin.firestore();
        await assertSucceeds(db.doc('clients/client_test').update({
            'onboarding.hasBeenInvoiced': true
        }));
    });

    it('System (Custom Token) should SUCCEED to update financial fields', async () => {
        await setupClient();
        // Simula um token com claim 'system: true'
        const system = testEnv.authenticatedContext('system_agent', {
            system: true,
            role: 'editor', // Role de auditor/editor para passar no isEditor()
            allowedBases: ['BASE_A']
        });

        const db = system.firestore();
        await assertSucceeds(db.doc('clients/client_test').update({
            'onboarding.hasBeenInvoiced': true,
            'onboarding.firstInvoiceAt': new Date()
        }));
    });

    it('Editor should SUCCEED to update non-financial onboarding fields', async () => {
        await setupClient();
        const editor = testEnv.authenticatedContext('editor_user', {
            role: 'editor',
            allowedBases: ['BASE_A']
        });

        const db = editor.firestore();
        await assertSucceeds(db.doc('clients/client_test').update({
            'onboarding.pipelineStatus': 'waiting_apportionment'
        }));
    });
});
