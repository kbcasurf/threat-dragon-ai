import { Env } from './Env.js';

class AiProviderEnv extends Env {
    constructor () {
        super('AiProvider');
    }

    get prefix () {
        return 'AI_PROVIDER_';
    }

    // Note that the actual env var will be prepended with AI_PROVIDER_
    get properties () {
        return [
            { key: 'API_URL', required: false },
            { key: 'API_KEY', required: false },
            { key: 'API_FORMAT', required: false, defaultValue: 'openai' },
            { key: 'MODEL', required: false },
            { key: 'TIMEOUT_MS', required: false, defaultValue: 60000 },
            { key: 'MAX_TOKENS', required: false, defaultValue: 2000 },
            { key: 'MAX_IMAGE_BYTES', required: false, defaultValue: 6000000 },
            { key: 'EXTRA_BODY', required: false, defaultValue: '{}' }
        ];
    }
}

export default AiProviderEnv;
