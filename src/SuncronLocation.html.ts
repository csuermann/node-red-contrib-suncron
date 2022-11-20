type SuncronLocationEditorConfig = import('./SuncronLocationDef').SuncronLocationEditorConfig

RED.nodes.registerType<SuncronLocationEditorConfig>('suncron-location', {
	category: 'config',
	defaults: {
		lat: { value: '', required: true, validate: RED.validators.number() },
		lon: { value: '', required: true, validate: RED.validators.number() }
	},
	label: function () {
		return this.name || 'suncron-location'
	}
})
