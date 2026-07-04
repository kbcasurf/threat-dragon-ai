import aiReportApi from '@/service/api/aiReportApi.js';
import api from '@/service/api/api.js';

describe('service/api/aiReportApi.js', () => {
    const payload = { image: 'data:image/png;base64,AAA', diagram: { id: 'd1' } };

    beforeEach(() => {
        jest.spyOn(api, 'postAsync').mockResolvedValue({ threats: [] });
    });
    afterEach(() => { jest.restoreAllMocks(); });

    it('posts the payload to /api/ai/threats', async () => {
        await aiReportApi.analyzeAsync(payload);
        expect(api.postAsync).toHaveBeenCalledWith('/api/ai/threats', payload);
    });

    it('resolves with the response data', async () => {
        api.postAsync.mockResolvedValue({ threats: [{ title: 'T' }] });
        const result = await aiReportApi.analyzeAsync(payload);
        expect(result.threats[0].title).toBe('T');
    });

    it('forwards the locale in the posted body', async () => {
        await aiReportApi.analyzeAsync({ image: 'x', diagram: {}, locale: 'ja' });
        expect(api.postAsync).toHaveBeenCalledWith('/api/ai/threats', { image: 'x', diagram: {}, locale: 'ja' });
    });
});
