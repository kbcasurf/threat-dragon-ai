import { expect } from 'chai';
import sinon from 'sinon';
import * as service from '../../src/services/aiProviderService.js';

const validContent = JSON.stringify({
    threats: [{
        elementId: 'cell-1', elementName: 'Web App', stride: 'Spoofing',
        severity: 'High', title: 'No auth', description: 'Anonymous access',
        mitigation: 'Add authentication'
    }]
});
const okOpenAi = () => ({ post: sinon.stub().resolves({ data: { choices: [{ message: { content: validContent } }] } }) });

describe('services/aiProviderService.js', () => {
    describe('parseThreatsFromContent', () => {
        it('parses a clean JSON payload', () => {
            expect(service.parseThreatsFromContent(validContent)[0].title).to.equal('No auth');
        });

        it('parses JSON wrapped in a markdown code fence', () => {
            const fenced = '```json\n' + validContent + '\n```';
            expect(service.parseThreatsFromContent(fenced)[0].stride).to.equal('Spoofing');
        });

        it('returns an empty array for unparseable content', () => {
            expect(service.parseThreatsFromContent('not json at all')).to.deep.equal([]);
        });

        it('drops entries missing a title', () => {
            const messy = JSON.stringify({ threats: [{ description: 'x' }, JSON.parse(validContent).threats[0]] });
            expect(service.parseThreatsFromContent(messy).length).to.equal(1);
        });

        it('defaults elementId to null when absent', () => {
            const noId = JSON.stringify({ threats: [{ elementName: 'X', title: 'T', stride: 'Tampering', severity: 'Low', description: 'd', mitigation: 'm' }] });
            expect(service.parseThreatsFromContent(noId)[0].elementId).to.equal(null);
        });

        it('truncates over-long free text (T5)', () => {
            const long = JSON.stringify({ threats: [{ title: 't', stride: 'Tampering', severity: 'Low', description: 'x'.repeat(5000), mitigation: 'm' }] });
            expect(service.parseThreatsFromContent(long)[0].description.length).to.equal(2000);
        });

        it('strips control characters from free text (T5)', () => {
            const dirty = JSON.stringify({ threats: [{ title: 'a\tb', stride: 'Tampering', severity: 'Low', description: 'd', mitigation: 'm' }] });
            expect(service.parseThreatsFromContent(dirty)[0].title).to.equal('a b');
        });

        it('defaults an out-of-list stride to Tampering', () => {
            const bogus = JSON.stringify({ threats: [{ title: 't', stride: 'Bogus', severity: 'Low', description: 'd', mitigation: 'm' }] });
            expect(service.parseThreatsFromContent(bogus)[0].stride).to.equal('Tampering');
        });

        it('defaults an out-of-list severity to Medium', () => {
            const bogus = JSON.stringify({ threats: [{ title: 't', stride: 'Tampering', severity: 'Critical', description: 'd', mitigation: 'm' }] });
            expect(service.parseThreatsFromContent(bogus)[0].severity).to.equal('Medium');
        });
    });

    describe('analyzeDiagram', () => {
        const makeEnv = (overrides = {}) => ({ get: () => ({ config: {
            AI_PROVIDER_API_URL: 'https://prov.test/x',
            AI_PROVIDER_API_KEY: 'sk-test',
            AI_PROVIDER_API_FORMAT: 'openai',
            AI_PROVIDER_MODEL: 'test/model',
            AI_PROVIDER_TIMEOUT_MS: 1000,
            AI_PROVIDER_MAX_TOKENS: 500,
            AI_PROVIDER_EXTRA_BODY: '{"provider":{"data_collection":"deny"}}',
            ...overrides
        } }) });
        const envDep = makeEnv();

        it('openai: posts to the configured url with a bearer token', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: { id: 'd1' } }, { axiosDep, envDep });
            expect(axiosDep.post.firstCall.args[0]).to.equal('https://prov.test/x');
            expect(axiosDep.post.firstCall.args[2].headers.Authorization).to.equal('Bearer sk-test');
        });

        it('openai: merges EXTRA_BODY into the request body (T1)', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep });
            expect(axiosDep.post.firstCall.args[1].provider).to.deep.equal({ data_collection: 'deny' });
        });

        it('openai: sends the image as an image_url data-URI', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: {} }, { axiosDep, envDep });
            const userContent = axiosDep.post.firstCall.args[1].messages[1].content;
            expect(userContent[0].image_url.url).to.equal('data:image/png;base64,AAA');
        });

        it('does not send identifying headers (T3)', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep });
            const headers = axiosDep.post.firstCall.args[2].headers;
            expect(headers['HTTP-Referer'] || headers['X-Title']).to.equal(undefined);
        });

        it('anthropic: uses x-api-key + anthropic-version headers', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { content: [{ type: 'text', text: validContent }] } }) };
            await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: 'anthropic' }) });
            const headers = axiosDep.post.firstCall.args[2].headers;
            expect(headers['x-api-key']).to.equal('sk-test');
        });

        it('anthropic: sets the anthropic-version header', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { content: [{ type: 'text', text: validContent }] } }) };
            await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: 'anthropic' }) });
            const headers = axiosDep.post.firstCall.args[2].headers;
            expect(headers['anthropic-version']).to.equal('2023-06-01');
        });

        it('anthropic: sends base64 image data without the data-URI prefix', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { content: [{ type: 'text', text: validContent }] } }) };
            await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: 'anthropic' }) });
            expect(axiosDep.post.firstCall.args[1].messages[0].content[0].source.data).to.equal('AAA');
        });

        it('anthropic: parses threats from the content text blocks', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { content: [{ type: 'text', text: validContent }] } }) };
            const result = await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: 'anthropic' }) });
            expect(result.threats[0].elementName).to.equal('Web App');
        });

        it('rejects with statusCode 500 when the api url is not https (T11)', async () => {
            try {
                await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep: { post: sinon.stub() }, envDep: makeEnv({ AI_PROVIDER_API_URL: 'http://insecure/x' }) });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.statusCode).to.equal(500);
            }
        });

        it('never calls axios post when the api url is not https (T11)', async () => {
            const post = sinon.stub();
            try {
                await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep: { post }, envDep: makeEnv({ AI_PROVIDER_API_URL: 'http://insecure/x' }) });
                expect.fail('should have thrown');
            } catch {
                // expected
            }
            expect(post.called).to.equal(false);
        });

        it('openai: returns normalized threats from the model response', async () => {
            const result = await service.analyzeDiagram({ image: 'data:image/png;base64,AAA', diagram: { id: 'd1' } }, { axiosDep: okOpenAi(), envDep });
            expect(result.threats[0].elementName).to.equal('Web App');
        });

        it('rejects with statusCode 502 when the upstream call fails', async () => {
            const axiosDep = { post: sinon.stub().rejects(new Error('network down')) };
            try {
                await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.statusCode).to.equal(502);
            }
        });

        it('rejects with statusCode 502 when the upstream 200 response content is not JSON', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { choices: [{ message: { content: 'not json at all' } }] } }) };
            try {
                await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.statusCode).to.equal(502);
            }
        });

        it('resolves to an empty threats array when the response JSON has no threats', async () => {
            const axiosDep = { post: sinon.stub().resolves({ data: { choices: [{ message: { content: '{"threats":[]}' } }] } }) };
            const result = await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep });
            expect(result).to.deep.equal({ threats: [] });
        });

        it('dispatches to the openai adapter when AI_PROVIDER_API_FORMAT is unrecognized', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: 'bogus' }) });
            const headers = axiosDep.post.firstCall.args[2].headers;
            expect(headers.Authorization).to.equal('Bearer sk-test');
        });

        it('dispatches to the openai adapter when AI_PROVIDER_API_FORMAT is undefined', async () => {
            const axiosDep = okOpenAi();
            await service.analyzeDiagram({ image: 'x', diagram: {} }, { axiosDep, envDep: makeEnv({ AI_PROVIDER_API_FORMAT: undefined }) });
            const headers = axiosDep.post.firstCall.args[2].headers;
            expect(headers.Authorization).to.equal('Bearer sk-test');
        });
    });
});
