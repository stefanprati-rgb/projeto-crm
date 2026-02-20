import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv;
const PROJECT_ID = 'hube-crm-test';

describe('Firestore Security Rules', () => {
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

    describe('Multi-tenancy isolation', () => {
        it('should allow user to read client from their allowed base', async () => {
            const alice = testEnv.authenticatedContext('alice', {
                role: 'editor',
                allowedBases: ['BASE_A']
            });

            // Mock user document
            await testEnv.withSecurityRulesDisabled(async (context) => {
                const db = context.firestore();
                await db.doc('users/alice').set({ role: 'editor', allowedBases: ['BASE_A'] });
                await db.doc('clients/client_1').set({ name: 'Client 1', database: 'BASE_A' });
            });

            const db = alice.firestore();
            await assertSucceeds(db.doc('clients/client_1').get());
        });

        it('should deny user to read client from another base', async () => {
            const alice = testEnv.authenticatedContext('alice', {
                role: 'editor',
                allowedBases: ['BASE_A']
            });

            await testEnv.withSecurityRulesDisabled(async (context) => {
                const db = context.firestore();
                await db.doc('users/alice').set({ role: 'editor', allowedBases: ['BASE_A'] });
                await db.doc('clients/client_2').set({ name: 'Client 2', database: 'BASE_B' });
            });

            const db = alice.firestore();
            await assertFails(db.doc('clients/client_2').get());
        });

        it('should allow admin to read client from any base', async () => {
            const bob = testEnv.authenticatedContext('bob', { role: 'admin' });

            await testEnv.withSecurityRulesDisabled(async (context) => {
                const db = context.firestore();
                await db.doc('users/bob').set({ role: 'admin' });
                await db.doc('clients/client_3').set({ name: 'Client 3', database: 'BASE_C' });
            });

            const db = bob.firestore();
            await assertSucceeds(db.doc('clients/client_3').get());
        });
    });

    describe('Onboarding validation', () => {
        it('should deny invalid pipelineStatus in onboarding object', async () => {
            const alice = testEnv.authenticatedContext('alice', {
                role: 'editor',
                allowedBases: ['BASE_A']
            });

            await testEnv.withSecurityRulesDisabled(async (context) => {
                const db = context.firestore();
                await db.doc('users/alice').set({ role: 'editor', allowedBases: ['BASE_A'] });
            });

            const db = alice.firestore();
            await assertFails(db.collection('clients').add({
                name: 'Invalid Onboarding',
                database: 'BASE_A',
                status: 'active',
                createdBy: 'alice',
                createdAt: new Date(),
                onboarding: {
                    pipelineStatus: 'INVALID_STATUS'
                }
            }));
        });

        it('should allow valid onboarding sequence', async () => {
            const alice = testEnv.authenticatedContext('alice', {
                role: 'editor',
                allowedBases: ['BASE_A']
            });

            await testEnv.withSecurityRulesDisabled(async (context) => {
                const db = context.firestore();
                await db.doc('users/alice').set({ role: 'editor', allowedBases: ['BASE_A'] });
            });

            const db = alice.firestore();
            await assertSucceeds(db.collection('clients').add({
                name: 'Valid Onboarding',
                database: 'BASE_A',
                status: 'active',
                createdBy: 'alice',
                createdAt: new Date(),
                onboarding: {
                    pipelineStatus: 'new'
                }
            }));
        });
    });
});
