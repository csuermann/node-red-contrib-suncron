import { EditorRED } from 'node-red'
import { SuncronLocationEditorConfig } from './SuncronLocationDef'

declare const RED: EditorRED

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
