import { expect } from 'chai';
import AiProviderEnv from '../../src/env/AiProvider.js';

describe('env/AiProvider.js', () => {
    let target;
    beforeEach(() => { target = new AiProviderEnv(); });

    it('uses the AI_PROVIDER_ prefix', () => {
        expect(target.prefix).to.equal('AI_PROVIDER_');
    });

    it('defaults the API format to openai', () => {
        const apiFormat = target.properties.find((p) => p.key === 'API_FORMAT');
        expect(apiFormat.defaultValue).to.equal('openai');
    });

    it('does not require the API key', () => {
        const apiKey = target.properties.find((p) => p.key === 'API_KEY');
        expect(apiKey.required).to.equal(false);
    });

    it('defaults the request timeout to 60000 ms', () => {
        const timeout = target.properties.find((p) => p.key === 'TIMEOUT_MS');
        expect(timeout.defaultValue).to.equal(60000);
    });

    it('defaults max tokens to 2000', () => {
        const maxTokens = target.properties.find((p) => p.key === 'MAX_TOKENS');
        expect(maxTokens.defaultValue).to.equal(2000);
    });

    it('defaults the max image size to 6 MB', () => {
        const maxImage = target.properties.find((p) => p.key === 'MAX_IMAGE_BYTES');
        expect(maxImage.defaultValue).to.equal(6000000);
    });

    it('defaults the extra request body to an empty object', () => {
        const extra = target.properties.find((p) => p.key === 'EXTRA_BODY');
        expect(extra.defaultValue).to.equal('{}');
    });
});
