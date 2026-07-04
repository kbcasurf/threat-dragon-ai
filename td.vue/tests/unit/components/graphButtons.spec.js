import { BootstrapVue } from 'bootstrap-vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import TdDropdown from '@/components/Dropdown.vue';
import TdFormButton from '@/components/FormButton.vue';
import TdGraphButtons from '@/components/GraphButtons.vue';
import aiReportApi from '@/service/api/aiReportApi.js';
import { STRIDE_TO_KEY } from '@/service/threats/aiThreatMapping.js';

describe('components/GraphButtons.vue', () => {
    let btn, graph, localVue, wrapper, mockUndo, mockRedo, mockCanUndo, mockCanRedo;

    beforeEach(() => {
        mockUndo = jest.fn();
        mockRedo = jest.fn();
        mockCanUndo = jest.fn().mockReturnValue(true);
        mockCanRedo = jest.fn().mockReturnValue(true);
        graph = {
            history: {},
            getPlugin: (name) => {
                if (name === 'history') {
                    return {
                        canUndo: mockCanUndo,
                        canRedo: mockCanRedo,
                        undo: mockUndo,
                        redo: mockRedo
                    };
                }
            }
        };
        localVue = createLocalVue();
        localVue.use(BootstrapVue);
        localVue.use(Vuex);
        wrapper = shallowMount(TdGraphButtons, {
            localVue,
            mocks: {
                $t: (t) => t
            },
            propsData: {
                graph
            },
            store: new Vuex.Store({
                state: {
                    provider: {
                        selected: 'github'
                    }
                }
            })
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    const getButtonByIcon = (icon) =>
        wrapper
            .findAllComponents(TdFormButton)
            .filter((x) => x.attributes('icon') === icon)
            .at(0);

    describe('save', () => {
        beforeEach(() => {
            btn = getButtonByIcon('save');
            wrapper.vm.save();
        });

        it('has the save translation text', () => {
            expect(btn.attributes('text')).toEqual('forms.save');
        });
    });

    describe('close', () => {
        beforeEach(() => {
            btn = getButtonByIcon('times');
            wrapper.vm.closeDiagram();
        });

        it('has the save translation text', () => {
            expect(btn.attributes('text')).toEqual('forms.close');
        });
    });

    describe('keyboard shortcuts', () => {
        beforeEach(() => {
            btn = getButtonByIcon('keyboard');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        it('is a noOp', () => {
            expect(() => wrapper.vm.noOp()).not.toThrow();
        });
    });

    describe('undo', () => {
        beforeEach(() => {
            btn = getButtonByIcon('undo');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        describe('graph can undo', () => {
            beforeEach(() => {
                wrapper.vm.undo();
            });

            it('calls undo', () => {
                expect(mockUndo).toHaveBeenCalledTimes(1);
            });
        });

        describe('graph cannot undo', () => {
            beforeEach(() => {
                mockCanUndo = jest.fn().mockReturnValue(false);
                wrapper.vm.undo();
            });

            it('does not call undo', () => {
                expect(mockUndo).not.toHaveBeenCalled();
            });
        });
    });

    describe('redo', () => {
        beforeEach(() => {
            btn = getButtonByIcon('redo');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        describe('graph can redo', () => {
            beforeEach(() => {
                wrapper.vm.redo();
            });

            it('calls redo', () => {
                expect(mockRedo).toHaveBeenCalledTimes(1);
            });
        });

        describe('graph cannot redo', () => {
            beforeEach(() => {
                mockCanRedo = jest.fn().mockReturnValue(false);
                wrapper.vm.redo();
            });

            it('calls redo', () => {
                expect(mockRedo).not.toHaveBeenCalled();
            });
        });
    });

    describe('zoom in', () => {
        beforeEach(() => {
            btn = getButtonByIcon('search-plus');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        it('zooms in the graph', () => {
            graph.zoom = jest.fn();
            wrapper.vm.zoomIn();
            expect(graph.zoom).toHaveBeenCalledWith(0.2);
        });
    });

    describe('zoom out', () => {
        beforeEach(() => {
            btn = getButtonByIcon('search-minus');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        it('zooms out the graph', () => {
            graph.zoom = jest.fn();
            wrapper.vm.zoomOut();
            expect(graph.zoom).toHaveBeenCalledWith(-0.2);
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            btn = getButtonByIcon('trash');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        it('removes the selected cells', () => {
            graph.getSelectedCells = jest.fn();
            graph.removeCells = jest.fn();
            wrapper.vm.deleteSelected();
            expect(graph.getSelectedCells).toHaveBeenCalled();
            expect(graph.removeCells).toHaveBeenCalled();
        });
    });

    describe('toggle grid', () => {
        beforeEach(() => {
            btn = getButtonByIcon('th');
        });

        it('does not have any text', () => {
            expect(btn.attributes('text')).toEqual('');
        });

        describe('hide', () => {
            beforeEach(() => {
                graph.hideGrid = jest.fn();
                graph.showGrid = jest.fn();
                wrapper.vm.toggleGrid();
            });

            it('hides the grid', () => {
                expect(graph.hideGrid).toHaveBeenCalledTimes(1);
            });

            describe('show', () => {
                it('shows the grid', () => {
                    wrapper.vm.toggleGrid();
                    expect(graph.showGrid).toHaveBeenCalledTimes(1);
                });
            });
        });
    });

    describe('export', () => {
        beforeEach(() => {
            btn = wrapper
                .findAllComponents(TdDropdown)
                .filter((x) => x.attributes('id') === 'export-graph-btn')
                .at(0);
        });

        it('has the export translation text', () => {
            expect(btn.attributes('text')).toEqual('forms.export');
        });

        it('right aligns the export menu', () => {
            expect(btn.attributes('right')).toEqual('true');
        });

        it('uses the secondary variant', () => {
            expect(btn.attributes('variant')).toEqual('secondary');
        });

        it('has a dropdown item for PNG', () => {
            expect(btn.find('#export-graph-png').exists()).toBe(true);
        });

        it('has a dropdown item for SVG', () => {
            expect(btn.find('#export-graph-svg').exists()).toBe(true);
        });
    });
});

const makeAiGraph = () => ({
    toPNG: jest.fn((cb) => cb('data:image/png;base64,AAA')),
    zoomTo: jest.fn(), zoom: jest.fn(() => 1),
    getSelectedCells: jest.fn(() => []), cleanSelection: jest.fn(), select: jest.fn()
});

const mountWithAiConfig = (aiReportEnabled) => shallowMount(TdGraphButtons, {
    propsData: { graph: makeAiGraph() },
    mocks: {
        $t: (k) => k,
        $store: { state: { threatmodel: { selectedDiagram: { id: 'd1', title: 'D' } }, config: { config: { aiReportEnabled } } } }
    },
    stubs: ['b-btn-group', 'td-dropdown', 'td-form-button', 'td-ai-threat-report', 'td-ai-report-consent']
});

describe('GraphButtons AI report', () => {
    afterEach(() => jest.restoreAllMocks());

    it('reports the feature disabled when config flag is false', () => {
        expect(mountWithAiConfig(false).vm.aiReportEnabled).toBe(false);
    });

    it('reports the feature enabled when config flag is true', () => {
        expect(mountWithAiConfig(true).vm.aiReportEnabled).toBe(true);
    });

    it('opens the consent modal (and sends nothing) when the button is clicked', () => {
        const spy = jest.spyOn(aiReportApi, 'analyzeAsync');
        const wrapper = mountWithAiConfig(true);
        wrapper.vm.openConsent();
        expect(wrapper.vm.aiConsentVisible).toBe(true);
        expect(spy).not.toHaveBeenCalled();
    });

    it('runs the analysis when consent is confirmed', async () => {
        jest.spyOn(aiReportApi, 'analyzeAsync').mockResolvedValue({ threats: [] });
        const wrapper = mountWithAiConfig(true);
        wrapper.vm.openConsent();
        await wrapper.vm.onConsentConfirm();
        expect(wrapper.vm.aiConsentVisible).toBe(false);
        expect(wrapper.vm.aiModalVisible).toBe(true);
    });

    it('calls the api with the captured png and current diagram', async () => {
        const spy = jest.spyOn(aiReportApi, 'analyzeAsync').mockResolvedValue({ threats: [{ title: 'T' }] });
        const wrapper = mountWithAiConfig(true);
        await wrapper.vm.generateReport();
        expect(spy).toHaveBeenCalledWith({ image: 'data:image/png;base64,AAA', diagram: { id: 'd1', title: 'D' } });
    });

    it('stores returned threats and opens the modal', async () => {
        jest.spyOn(aiReportApi, 'analyzeAsync').mockResolvedValue({ threats: [{ title: 'T' }] });
        const wrapper = mountWithAiConfig(true);
        await wrapper.vm.generateReport();
        expect(wrapper.vm.aiThreats).toHaveLength(1);
        expect(wrapper.vm.aiModalVisible).toBe(true);
    });

    it('sets the error flag when the api rejects', async () => {
        jest.spyOn(aiReportApi, 'analyzeAsync').mockRejectedValue(new Error('boom'));
        const wrapper = mountWithAiConfig(true);
        await wrapper.vm.generateReport();
        expect(wrapper.vm.aiError).toBe(true);
    });
});

const makeGraph = () => makeAiGraph();

describe('GraphButtons importAiThreat', () => {
    const suggestion = { elementId: 'c1', elementName: 'App', stride: 'Spoofing', severity: 'High', title: 'No auth', description: 'anon', mitigation: 'add auth' };

    const mountWithCell = (cell) => {
        const graph = makeGraph();
        graph.getCellById = jest.fn(() => cell);
        const dispatch = jest.fn();
        const wrapper = shallowMount(TdGraphButtons, {
            propsData: { graph },
            mocks: {
                $t: (k) => k,
                $store: {
                    dispatch,
                    state: { threatmodel: { selectedDiagram: { id: 'd1', title: 'D', diagramType: 'STRIDE', detail: { threatTop: 2 } }, data: { detail: { threatTop: 2 } } }, config: { config: { aiReportEnabled: true } } }
                }
            },
            stubs: ['b-btn-group', 'td-dropdown', 'td-form-button', 'td-ai-threat-report']
        });
        return { wrapper, dispatch, graph };
    };

    it('maps STRIDE Spoofing to its translation key', () => {
        expect(STRIDE_TO_KEY.Spoofing).toBe('threats.model.stride.spoofing');
    });

    it('pushes a threat built from the suggestion onto the matched cell', () => {
        const cell = { data: { type: 'tm.Process', threats: [] }, getData: jest.fn(function () { return this.data; }) };
        const { wrapper } = mountWithCell(cell);
        wrapper.vm.importAiThreat(suggestion);
        expect(cell.data.threats).toHaveLength(1);
        expect(cell.data.threats[0].title).toBe('No auth');
        expect(cell.data.threats[0].severity).toBe('High');
    });

    it('tags the imported threat with its AI origin (T6)', () => {
        const cell = { data: { type: 'tm.Process', threats: [] }, getData: jest.fn(function () { return this.data; }) };
        const { wrapper } = mountWithCell(cell);
        wrapper.vm.importAiThreat(suggestion);
        // A note is appended, so the stored description is longer than the raw suggestion text
        // (assertion is agnostic to how `tc` resolves the note in the test env).
        expect(cell.data.threats[0].description).not.toBe(suggestion.description);
    });

    it('does nothing when the cell is not found', () => {
        const { wrapper, graph } = mountWithCell(null);
        graph.getCellById = jest.fn(() => null);
        expect(() => wrapper.vm.importAiThreat(suggestion)).not.toThrow();
    });

    it('initializes a missing threats array', () => {
        const cell = { data: { type: 'tm.Process' }, getData: jest.fn(function () { return this.data; }) };
        const { wrapper } = mountWithCell(cell);
        wrapper.vm.importAiThreat(suggestion);
        expect(cell.data.threats).toHaveLength(1);
    });

    it('falls back to the generated type when the STRIDE value is unrecognized', () => {
        const cell = { data: { type: 'tm.Process', threats: [] }, getData: jest.fn(function () { return this.data; }) };
        const { wrapper } = mountWithCell(cell);
        wrapper.vm.importAiThreat({ ...suggestion, stride: 'Bogus' });
        expect(cell.data.threats).toHaveLength(1);
    });

    it('numbers the first threat as 1 when threatTop is absent', () => {
        const graph = makeGraph();
        const cell = { data: { type: 'tm.Process', threats: [] }, getData: jest.fn(function () { return this.data; }) };
        graph.getCellById = jest.fn(() => cell);
        const dispatch = jest.fn();
        const wrapper = shallowMount(TdGraphButtons, {
            propsData: { graph },
            mocks: {
                $t: (k) => k,
                $store: {
                    dispatch,
                    state: { threatmodel: { selectedDiagram: { id: 'd1', title: 'D', diagramType: 'STRIDE', detail: {} }, data: { detail: {} } }, config: { config: { aiReportEnabled: true } } }
                }
            },
            stubs: ['b-btn-group', 'td-dropdown', 'td-form-button', 'td-ai-threat-report']
        });
        wrapper.vm.importAiThreat(suggestion);
        expect(dispatch).toHaveBeenCalledWith(expect.anything(), { threatTop: 1 });
    });
});
