import en from '@/i18n/en.js';

describe('i18n en aiReport', () => {
    it('has a generateReport label', () => {
        expect(en.aiReport.generateReport).toBeTruthy();
    });
    it('has an import label', () => {
        expect(en.aiReport.import).toBeTruthy();
    });
    it('has an unmatched label', () => {
        expect(en.aiReport.unmatched).toBeTruthy();
    });
    it('has a consent acceptance label', () => {
        expect(en.aiReport.consent.accept).toBeTruthy();
    });
    it('has an advisory banner', () => {
        expect(en.aiReport.advisory).toBeTruthy();
    });
});
