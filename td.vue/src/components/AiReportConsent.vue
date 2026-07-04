<!-- td.vue/src/components/AiReportConsent.vue -->
<template>
    <b-modal
        :visible="visible"
        :title="$t('aiReport.consent.title')"
        header-bg-variant="warning"
        no-close-on-backdrop
        @shown="onShown"
        @hide="cancel"
    >
        <p>{{ $t('aiReport.consent.intro') }}</p>
        <p>{{ $t('aiReport.consent.identifiers') }}</p>
        <p>{{ $t('aiReport.consent.https') }}</p>
        <b-form-checkbox v-model="accepted" id="ai-consent-accept">
            {{ $t('aiReport.consent.accept') }}
        </b-form-checkbox>
        <template #modal-footer>
            <b-button variant="secondary" @click="cancel">
                {{ $t('aiReport.consent.cancel') }}
            </b-button>
            <b-button variant="primary" :disabled="!canAnalyze" @click="confirm" id="ai-consent-analyze">
                {{ $t('aiReport.consent.analyze') }}
            </b-button>
        </template>
    </b-modal>
</template>

<script>
export default {
    name: 'TdAiReportConsent',
    props: {
        visible: { type: Boolean, default: false }
    },
    data() {
        return { accepted: false };
    },
    computed: {
        canAnalyze() {
            return this.accepted === true;
        }
    },
    methods: {
        onShown() {
            this.accepted = false;
        },
        confirm() {
            if (!this.canAnalyze) { return; }
            this.$emit('confirm');
        },
        cancel() {
            this.$emit('cancel');
        }
    }
};
</script>
