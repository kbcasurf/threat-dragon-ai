<template>
    <b-btn-group>
        <td-form-button
            :onBtnClick="deleteSelected"
            icon="trash"
            :title="$t('threatmodel.buttons.delete')"
            text="" />

        <td-form-button
            :onBtnClick="noOp"
            v-b-modal.shortcuts
            icon="keyboard"
            :title="$t('threatmodel.buttons.shortcuts')"
            text="" />

        <td-form-button
            :onBtnClick="undo"
            icon="undo"
            :title="$t('threatmodel.buttons.undo')"
            text="" />

        <td-form-button
            :onBtnClick="redo"
            icon="redo"
            :title="$t('threatmodel.buttons.redo')"
            text="" />

        <td-form-button
            :onBtnClick="zoomIn"
            icon="search-plus"
            :title="$t('threatmodel.buttons.zoomIn')"
            text="" />

        <td-form-button
            :onBtnClick="zoomOut"
            icon="search-minus"
            :title="$t('threatmodel.buttons.zoomOut')"
            text="" />

        <td-form-button
            :onBtnClick="toggleGrid"
            icon="th"
            :title="$t('threatmodel.buttons.toggleGrid')"
            text="" />

        <td-form-button
            v-if="aiReportEnabled"
            :onBtnClick="openConsent"
            icon="robot"
            :title="$t('aiReport.generateReport')"
            :text="$t('aiReport.generateReport')"
            id="ai-generate-report" />

        <td-dropdown right variant="secondary" :text="$t('forms.export')" id="export-graph-btn">
            <template #default="{ close }">
                <button type="button" class="td-dropdown-item" @click="exportPNG(); close()" id="export-graph-png">
                    PNG
                </button>
                <button type="button" class="td-dropdown-item" @click="exportSVG(); close()" id="export-graph-svg">
                    SVG
                </button>
            </template>
        </td-dropdown>

        <td-form-button
            :onBtnClick="closeDiagram"
            icon="times"
            :text="$t('forms.close')" />

        <td-form-button
            :isPrimary="true"
            :onBtnClick="save"
            icon="save"
            :text="$t('forms.save')" />

        <td-ai-report-consent
            :visible="aiConsentVisible"
            @confirm="onConsentConfirm"
            @cancel="aiConsentVisible = false" />

        <td-ai-threat-report
            :threats="aiThreats"
            :loading="aiLoading"
            :error="aiError"
            :visible="aiModalVisible"
            @hide="aiModalVisible = false"
            @import="importAiThreat" />

    </b-btn-group>
</template>

<script>
import aiReportApi from '@/service/api/aiReportApi.js';
import TdAiReportConsent from '@/components/AiReportConsent.vue';
import TdAiThreatReport from '@/components/AiThreatReport.vue';
import TdDropdown from '@/components/Dropdown.vue';
import TdFormButton from '@/components/FormButton.vue';
import { createNewTypedThreat } from '@/service/threats/index.js';
import { STRIDE_TO_KEY } from '@/service/threats/aiThreatMapping.js';
import { CELL_DATA_UPDATED } from '@/store/actions/cell.js';
import dataChanged from '@/service/x6/graph/data-changed.js';
import tmActions from '@/store/actions/threatmodel.js';
import { tc } from '@/i18n/index.js';

export default {
    name: 'TdGraphButtons',
    components: {
        TdAiReportConsent,
        TdAiThreatReport,
        TdDropdown,
        TdFormButton
    },
    computed: {
        diagram() { return this.$store.state.threatmodel.selectedDiagram; },
        aiReportEnabled() {
            const config = this.$store.state.config?.config;
            return !!(config && config.aiReportEnabled);
        }
    },
    data() {
        return {
            gridShowing: true,
            aiThreats: [],
            aiLoading: false,
            aiError: false,
            aiModalVisible: false,
            aiConsentVisible: false
        };
    },
    props: {
        graph: {
            required: true
        }
    },
    methods: {
        save() {
            this.$emit('saved');
        },
        async closeDiagram() {
            this.$emit('closed');
        },
        noOp() {
            return;
        },
        undo() {
            if (this.graph.getPlugin('history').canUndo()) {
                this.graph.getPlugin('history').undo();
            }
        },
        redo() {
            if (this.graph.getPlugin('history').canRedo()) {
                this.graph.getPlugin('history').redo();
            }
        },
        zoomIn() {
            if (this.graph.zoom() < 1.0) {
                this.graph.zoom(0.1);
            } else {
                this.graph.zoom(0.2);
            }
            console.debug('zoom to ' + this.graph.zoom());
        },
        zoomOut() {
            if (this.graph.zoom() < 1.0) {
                this.graph.zoom(-0.1);
            } else {
                this.graph.zoom(-0.2);
            }
            console.debug('zoom to ' + this.graph.zoom());
        },
        deleteSelected() {
            this.graph.removeCells(this.graph.getSelectedCells());
        },
        toggleGrid() {
            if (this.gridShowing) {
                this.graph.hideGrid();
                this.gridShowing = false;
            } else {
                this.graph.showGrid();
                this.gridShowing = true;
            }
        },
        async exportPNG() {
            await this.withSelectionCleared(() => {
                const currentZoom = this.graph.zoom();
                try {
                    this.graph.zoomTo(1);
                    this.graph.exportPNG(`${this.diagram.title}.png`, {
                        padding: 50
                    });
                }finally{
                    this.graph.zoomTo(currentZoom);
                }
            });
        },
        async exportSVG() {
            await this.withSelectionCleared(() => {
                const currentZoom = this.graph.zoom();
                try{
                    this.graph.zoomTo(1);
                    this.graph.exportSVG(`${this.diagram.title}.svg`);
                }finally{
                    this.graph.zoomTo(currentZoom);
                }
            });
        },
        async withSelectionCleared(fn) {

            const selectedCells = this.graph.getSelectedCells();


            try {
                this.graph.cleanSelection();

                //Rendering is not immediate. Without this pause the export may include
                //the previous selection highlight.
                await new Promise(resolve => setTimeout(resolve, 100));

                return fn();
            } finally {


                if (selectedCells.length > 0) {
                    this.graph.select(selectedCells);
                }
            }
        },
        openConsent() {
            this.aiConsentVisible = true;
        },
        async onConsentConfirm() {
            this.aiConsentVisible = false;
            await this.generateReport();
        },
        capturePng() {
            return new Promise((resolve) => {
                const currentZoom = this.graph.zoom();
                try {
                    this.graph.zoomTo(1);
                    this.graph.toPNG((dataUri) => {
                        this.graph.zoomTo(currentZoom);
                        resolve(dataUri);
                    }, { padding: 50 });
                } catch (e) {
                    this.graph.zoomTo(currentZoom);
                    throw e;
                }
            });
        },
        async generateReport() {
            this.aiError = false;
            this.aiThreats = [];
            this.aiLoading = true;
            this.aiModalVisible = true;
            try {
                const image = await this.withSelectionCleared(() => this.capturePng());
                const result = await aiReportApi.analyzeAsync({ image, diagram: this.diagram });
                this.aiThreats = result.threats || [];
            } catch {
                this.aiError = true;
            } finally {
                this.aiLoading = false;
            }
        },
        importAiThreat(suggestion) {
            const cell = suggestion.elementId ? this.graph.getCellById(suggestion.elementId) : null;
            if (!cell || !cell.data) { return; }
            if (!Array.isArray(cell.data.threats)) { cell.data.threats = []; }

            const nextNumber = (this.$store.state.threatmodel.data.detail.threatTop || 0) + 1;
            const threat = createNewTypedThreat(this.diagram.diagramType, cell.data.type, nextNumber);
            const strideKey = STRIDE_TO_KEY[suggestion.stride];

            threat.title = suggestion.title;
            threat.type = strideKey ? tc(strideKey) : threat.type;
            threat.severity = suggestion.severity;
            threat.description = `${suggestion.description}\n\n${tc('aiReport.importedNote')}`;
            threat.mitigation = suggestion.mitigation;

            cell.data.threats.push(threat);
            cell.data.hasOpenThreats = cell.data.threats.length > 0;

            this.$store.dispatch(tmActions.update, { threatTop: nextNumber });
            this.$store.dispatch(tmActions.modified);
            this.$store.dispatch(CELL_DATA_UPDATED, cell.data);
            dataChanged.updateStyleAttrs(cell);
        }
    }
};
</script>
