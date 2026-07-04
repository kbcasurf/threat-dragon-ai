import { expect } from 'chai';
import sinon from 'sinon';

import { createAiReportController } from '../../src/controllers/aiReportController.js';

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe('controllers/aiReportController.js', () => {
    const enabledEnv = { get: () => ({ config: { AI_PROVIDER_API_KEY: 'sk-x', AI_PROVIDER_MAX_IMAGE_BYTES: 6000000 } }) };
    const disabledEnv = { get: () => ({ config: { AI_PROVIDER_API_KEY: '' } }) };
    const pngUri = 'data:image/png;base64,AAA';

    it('returns 403 when the feature is disabled', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: disabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { image: pngUri, diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(403);
    });

    it('returns 400 when the request body is entirely missing', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({}, res);
        expect(res.status.firstCall.args[0]).to.equal(400);
    });

    it('returns 400 when the image is missing', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(400);
    });

    it('returns 400 when the image is not a PNG data-URI', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { image: 'not-a-data-uri', diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(400);
    });

    it('returns 400 when the diagram is missing', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { image: pngUri } }, res);
        expect(res.status.firstCall.args[0]).to.equal(400);
    });

    it('returns 400 when the diagram is null', async () => {
        const res = mockRes();
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { image: pngUri, diagram: null } }, res);
        expect(res.status.firstCall.args[0]).to.equal(400);
    });

    it('returns 413 when the image exceeds the size cap (T8)', async () => {
        const res = mockRes();
        const smallCapEnv = { get: () => ({ config: { AI_PROVIDER_API_KEY: 'sk-x', AI_PROVIDER_MAX_IMAGE_BYTES: 10 } }) };
        const controller = createAiReportController({ envDep: smallCapEnv, serviceDep: { analyzeDiagram: sinon.stub() } });
        await controller.analyze({ body: { image: pngUri + 'A'.repeat(50), diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(413);
    });

    it('falls back to the default max image size when AI_PROVIDER_MAX_IMAGE_BYTES is unset', async () => {
        const res = mockRes();
        const noMaxEnv = { get: () => ({ config: { AI_PROVIDER_API_KEY: 'sk-x' } }) };
        const serviceDep = { analyzeDiagram: sinon.stub().resolves({ threats: [] }) };
        const controller = createAiReportController({ envDep: noMaxEnv, serviceDep });
        await controller.analyze({ body: { image: pngUri, diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(200);
    });

    it('returns 200 with threats on success', async () => {
        const res = mockRes();
        const serviceDep = { analyzeDiagram: sinon.stub().resolves({ threats: [{ title: 'T' }] }) };
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep });
        await controller.analyze({ body: { image: pngUri, diagram: { id: 'd' } } }, res);
        expect(res.status.firstCall.args[0]).to.equal(200);
        expect(res.json.firstCall.args[0].threats[0].title).to.equal('T');
    });

    it('returns 502 when the service fails', async () => {
        const res = mockRes();
        const err = new Error('boom'); err.statusCode = 502;
        const serviceDep = { analyzeDiagram: sinon.stub().rejects(err) };
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep });
        await controller.analyze({ body: { image: pngUri, diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(502);
    });

    it('returns 502 when the service fails without a statusCode', async () => {
        const res = mockRes();
        const serviceDep = { analyzeDiagram: sinon.stub().rejects(new Error('boom')) };
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep });
        await controller.analyze({ body: { image: pngUri, diagram: {} } }, res);
        expect(res.status.firstCall.args[0]).to.equal(502);
    });

    it('does not log the request body, image, or diagram content on failure', async () => {
        const res = mockRes();
        const err = new Error('boom - should not appear in logs'); err.statusCode = 502;
        const serviceDep = { analyzeDiagram: sinon.stub().rejects(err) };
        const loggerDep = { warn: sinon.stub() };
        const controller = createAiReportController({ envDep: enabledEnv, serviceDep, loggerDep });
        await controller.analyze({ body: { image: pngUri, diagram: { secret: 'do-not-log-me' } } }, res);

        expect(loggerDep.warn.calledOnce).to.equal(true);
        const loggedArgs = loggerDep.warn.firstCall.args;
        const serialized = JSON.stringify(loggedArgs);
        expect(serialized).to.not.include(pngUri);
        expect(serialized).to.not.include('do-not-log-me');
        expect(serialized).to.not.include('should not appear in logs');
    });

    it('uses the default env, service and logger dependencies when none are supplied', () => {
        const controller = createAiReportController();
        expect(controller.analyze).to.be.a('function');
    });
});
