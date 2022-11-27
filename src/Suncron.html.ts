type SuncronEditorConfig = import('./SuncronDef').SuncronEditorConfig

RED.nodes.registerType<SuncronEditorConfig>('suncron', {
	category: 'common',
	color: '#FFCC66',
	defaults: {
		name: { value: '' },
		location: { value: '', type: 'suncron-location', required: true },
		sunEventType: { value: 'sunrise' },
		payload: { value: '', required: false, validate: RED.validators.typedInput('payloadType') },
		payloadType: { value: 'str', required: false },
		topic: { value: '', required: false },
		offset: { value: 0, required: true, validate: RED.validators.number() }
	},
	inputs: 0,
	outputs: 1,
	icon: 'font-awesome/fa-sun-o',
	label: function () {
		if (this.name) {
			return this.name
		} else {
			return getDisplayName({
				event: this.sunEventType,
				offset: this.offset
			})
		}
	},
	oneditprepare: function () {
		$('#node-input-payload').typedInput({
			default: 'str',
			typeField: $('#node-input-payloadType'),
			types: ['str', 'num', 'bool', 'json'],
		})
	}
})
