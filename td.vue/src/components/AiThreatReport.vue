<!-- td.vue/src/components/AiThreatReport.vue -->
<template>
    <b-modal
        :visible="visible"
        size="xl"
        :title="$t('aiReport.title')"
        ok-only
        scrollable
        @hide="$emit('hide')"
    >
        <b-alert show variant="warning" class="td-ai-advisory">
            {{ $t('aiReport.advisory') }}
        </b-alert>
        <div v-if="loading" class="text-center">
            <b-spinner /> {{ $t('aiReport.analyzing') }}
        </div>
        <div v-else-if="error" class="text-danger">
            {{ $t('aiReport.error') }}
        </div>
        <div v-else-if="rows.length === 0">
            {{ $t('aiReport.noThreats') }}
        </div>
        <b-table v-else :items="rows" :fields="fields">
            <template #cell(actions)="data">
                <b-button size="sm" variant="primary" @click="importThreat(data.item.suggestion)">
                    {{ $t('aiReport.import') }}
                </b-button>
            </template>
        </b-table>
    </b-modal>
</template>

<script>
export default {
    name: 'TdAiThreatReport',
    props: {
        threats: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        error: { type: Boolean, default: false },
        visible: { type: Boolean, default: false }
    },
    computed: {
        fields() {
            return [
                { key: 'elementName', label: this.$t('aiReport.element') },
                { key: 'stride', label: this.$t('aiReport.strideType') },
                { key: 'severity', label: this.$t('aiReport.severity') },
                { key: 'title', label: this.$t('threats.properties.title') },
                { key: 'mitigation', label: this.$t('aiReport.mitigation') },
                { key: 'actions', label: '' }
            ];
        },
        rows() {
            if (this.loading || this.error) { return []; }
            return this.threats.map((suggestion) => ({
                elementName: suggestion.elementName || this.$t('aiReport.unmatched'),
                stride: suggestion.stride,
                severity: suggestion.severity,
                title: suggestion.title,
                mitigation: suggestion.mitigation,
                suggestion
            }));
        }
    },
    methods: {
        importThreat(suggestion) {
            this.$emit('import', suggestion);
        }
    }
};
</script>
