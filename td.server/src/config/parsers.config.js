import express from 'express';

export const AI_ROUTE = '/api/ai/threats';
export const skipsGlobalJson = (path) => path === AI_ROUTE;

const config = (app) => {
    const jsonParser = express.json();
    // T8: the AI route uses its own bounded JSON parser (see routes.config.js)
    // so the global 100 kB limit is not raised for every other endpoint.
    app.use((req, res, next) => (skipsGlobalJson(req.path) ? next() : jsonParser(req, res, next)));
    app.use(express.urlencoded({ extended: true }));
};

export default {
    config
};
