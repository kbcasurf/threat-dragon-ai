import aiProviderService from '../services/aiProviderService.js';
import env from '../env/Env.js';
import loggerHelper from '../helpers/logger.helper.js';

const logger = loggerHelper.get('controllers/aiReportController.js');

const DEFAULT_MAX_IMAGE_BYTES = 6000000;
const PNG_DATA_URI_PREFIX = 'data:image/png;base64,';

export const createAiReportController = (deps = {}) => {
    const envDep = deps.envDep || env;
    const serviceDep = deps.serviceDep || aiProviderService;
    const loggerDep = deps.loggerDep || logger;

    const analyze = async (req, res) => {
        const config = envDep.get().config;
        const enabled = typeof config.AI_PROVIDER_API_KEY === 'string' && config.AI_PROVIDER_API_KEY.length > 0;
        if (!enabled) {
            return res.status(403).json({ error: 'AI threat report is not enabled' });
        }

        const { image, diagram } = req.body || {};
        const validImage = typeof image === 'string' && image.startsWith(PNG_DATA_URI_PREFIX);
        const validDiagram = diagram !== null && diagram !== undefined && typeof diagram === 'object';
        if (!validImage || !validDiagram) {
            return res.status(400).json({ error: 'a PNG image data-URI and a diagram object are required' });
        }

        const maxImageBytes = Number(config.AI_PROVIDER_MAX_IMAGE_BYTES) || DEFAULT_MAX_IMAGE_BYTES;
        if (image.length > maxImageBytes) {
            return res.status(413).json({ error: 'image is too large' });
        }

        try {
            const result = await serviceDep.analyzeDiagram({ image, diagram });
            return res.status(200).json(result);
        } catch (err) {
            const statusCode = err && err.statusCode ? err.statusCode : 502;
            // Security: never log the request body, image data, or diagram content — only the status code.
            loggerDep.warn(`AI threat analysis failed: statusCode=${statusCode}`);
            return res.status(statusCode).json({ error: 'AI threat analysis failed' });
        }
    };

    return { analyze };
};

const aiReportController = createAiReportController();
export default aiReportController;
