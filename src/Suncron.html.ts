import { EditorRED } from 'node-red'
import { SuncronEditorConfig } from './SuncronDef'

declare const RED: EditorRED

RED.nodes.registerType<SuncronEditorConfig>('suncron', {
	category: 'common',
	color: '#FFCC66',
	defaults: {
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
			if (this.offset == 0) {
				return this.sunEventType
			} else {
				const sign = this.offset > 0 ? '+' : '-'
				const offset = Math.abs(this.offset)
				const hour = Math.floor(offset / 60)
				const min = offset % 60
				let name = this.sunEventType + ' ' + sign
				if (hour > 0) {
					name += hour + 'h'
				}
				if (min > 0) {
					name += min + 'm'
				}
				return name
			}
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
