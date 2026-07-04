// td.vue/tests/unit/components/aiReportConsent.spec.js
import { shallowMount } from '@vue/test-utils';
import AiReportConsent from '@/components/AiReportConsent.vue';

const stubs = ['b-modal', 'b-form-checkbox', 'b-button'];
const t = (k) => k;

describe('AiReportConsent.vue', () => {
    it('cannot analyze until the risk is accepted', () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: true }, mocks: { $t: t }, stubs });
        expect(wrapper.vm.canAnalyze).toBe(false);
    });

    it('can analyze once the risk is accepted', async () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: true }, mocks: { $t: t }, stubs });
        wrapper.setData({ accepted: true });
        expect(wrapper.vm.canAnalyze).toBe(true);
    });

    it('emits confirm when accepted and confirm is invoked', () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: true }, mocks: { $t: t }, stubs });
        wrapper.setData({ accepted: true });
        wrapper.vm.confirm();
        expect(wrapper.emitted().confirm).toBeTruthy();
    });

    it('does not emit confirm when not accepted', () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: true }, mocks: { $t: t }, stubs });
        wrapper.vm.confirm();
        expect(wrapper.emitted().confirm).toBeFalsy();
    });

    it('emits cancel on cancel', () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: true }, mocks: { $t: t }, stubs });
        wrapper.vm.cancel();
        expect(wrapper.emitted().cancel).toBeTruthy();
    });

    it('resets acceptance when the modal is shown again', () => {
        const wrapper = shallowMount(AiReportConsent, { propsData: { visible: false }, mocks: { $t: t }, stubs });
        wrapper.setData({ accepted: true });
        wrapper.vm.onShown();
        expect(wrapper.vm.accepted).toBe(false);
    });
});
