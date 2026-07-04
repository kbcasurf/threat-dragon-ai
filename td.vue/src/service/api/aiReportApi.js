import api from './api.js';

const resource = '/api/ai/threats';

const analyzeAsync = async ({ image, diagram }) => await api.postAsync(resource, { image, diagram });

export default { analyzeAsync };
