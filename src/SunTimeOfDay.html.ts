type SunTimeOfDayEditorConfig = import('./SunTimeOfDayDef').SunTimeOfDayEditorConfig

RED.nodes.registerType<SunTimeOfDayEditorConfig>('sun-time-of-day', {
	category: 'function',
	color: '#FFCC66',
	defaults: {
		name: { value: '' },
		location: { value: '', type: 'suncron-location', required: true },
		dataPoints: { value: [
			{
				event: 'sunset',
				offset: 0
			},
			{
				event: 'midnight',
				offset: 1440
			}
			]
		},
		outputs: { value: 1 }
	},
	inputs: 1,
	outputs: 1,
	outputLabels: function(index) {
		// TODO
		return ''
	},
	icon: 'switch.svg',
	label: function () {
		if (this.name) {
			return this.name
		} else {
			// TODO
			return 'sun-time-of-day'
		}
	},
	oneditprepare: function () {
		const node = this
		$('#node-input-rule-container').css('min-height','150px').css('min-width','450px').editableList({
			addItem: function(container,i,opt) {
				// TODO
			},
			removeItem: function(opt) {
				// TODO
			},
			sortItems: function(rules) {
				// TODO
			},
			sortable: true,
			removable: true
		})
	},
	oneditsave: function() {
		// TODO
	},
	oneditresize: function(size) {
		// TODO
	}
})