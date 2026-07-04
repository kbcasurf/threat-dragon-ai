import api from './api.js';

const resource = '/api/ai/threats';

const analyzeAsync = async ({ image, diagram, locale }) => await api.postAsync(resource, { image, diagram, locale });

export default { analyzeAsync };
