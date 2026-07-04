// td.vue/tests/unit/components/aiThreatReport.spec.js
import { shallowMount } from '@vue/test-utils';
import AiThreatReport from '@/components/AiThreatReport.vue';

const stubs = ['b-modal', 'b-alert', 'b-table', 'b-button', 'b-spinner'];
const t = (k) => k;

describe('AiThreatReport.vue', () => {
    it('renders a row per threat', () => {
        const threats = [
            { elementId: 'c1', elementName: 'App', stride: 'Spoofing', severity: 'High', title: 'A', description: 'd', mitigation: 'm' },
            { elementId: 'c2', elementName: 'DB', stride: 'Tampering', severity: 'Low', title: 'B', description: 'd', mitigation: 'm' }
        ];
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats, loading: false, error: false, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.vm.rows).toHaveLength(2);
    });

    it('emits import with the suggestion when importThreat is called', () => {
        const threat = { elementId: 'c1', elementName: 'App', stride: 'Spoofing', severity: 'High', title: 'A', description: 'd', mitigation: 'm' };
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [threat], loading: false, error: false, visible: true }, mocks: { $t: t }, stubs });
        wrapper.vm.importThreat(threat);
        expect(wrapper.emitted().import[0][0]).toEqual(threat);
    });

    it('exposes an empty rows array while loading', () => {
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [], loading: true, error: false, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.vm.rows).toEqual([]);
    });

    it('exposes an empty rows array when in the error state', () => {
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [{ title: 'A' }], loading: false, error: true, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.vm.rows).toEqual([]);
    });

    it('renders the error message when error is true', () => {
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [], loading: false, error: true, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.find('.text-danger').exists()).toBe(true);
    });

    it('renders the no-threats message when there are no threats', () => {
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [], loading: false, error: false, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.text()).toContain('aiReport.noThreats');
    });

    it('falls back to the unmatched label when a threat has no elementName', () => {
        const wrapper = shallowMount(AiThreatReport, { propsData: { threats: [{ title: 'A', stride: 'Spoofing', severity: 'Low', mitigation: 'm' }], loading: false, error: false, visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.vm.rows[0].elementName).toBe('aiReport.unmatched');
    });
});
