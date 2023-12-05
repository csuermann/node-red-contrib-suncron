type SunTimeOfDayEditorConfig = import('./SunTimeOfDayDef').SunTimeOfDayEditorConfig

function exportDataPoint(element: HTMLElement): SuncronDataPoint {
	const event = $(element).find('select').val() as any
	const offset = $(element).find('input').val() as number
	return { event, offset }
}

const events = [
	'midnight',
	'sunrise',
	'sunriseEnd',
	'goldenHourEnd',
	'solarNoon',
	'goldenHour',
	'sunsetStart',
	'sunset',
	'dusk',
	'nauticalDusk',
	'night',
	'nadir',
	'nightEnd',
	'nauticalDawn',
	'dawn'
]

RED.nodes.registerType<SunTimeOfDayEditorConfig>('sun-time-of-day', {
	category: 'function',
	color: '#FFCC66',
	defaults: {
		name: { value: '' },
		location: { value: '', type: 'suncron-location', required: true },
		dataPoints: { value: [
			{
				event: 'sunsetStart',
				offset: 0
			},
			{
				event: 'midnight',
				offset: 0
			}
		]
		},
		outputs: { value: 1, validate: function(val) {
			return parseInt(val) > 0
		}}
	},
	inputs: 1,
	outputs: 1,
	icon: 'switch.svg',
	paletteLabel: 'sun time of day',
	label: function () {
		if (this.name) {
			return this.name
		} else {
			if (this.outputs == 0) {
				return 'sun-time-of-day'
			}
			let name = ''
			let previousPointName = ''
			for (const dataPoint of this.dataPoints) {
				if (name != '') {
					name += '\\n '
				}
				const currentPointName = getDisplayName(dataPoint)
				if (previousPointName != '') {
					name += `${previousPointName} <=> ${currentPointName}`
				}
				previousPointName = currentPointName
			}
			return name
		}
	},
	oneditprepare: function () {
		const node = this
		$('#node-input-rule-container')
			.css('min-height','150px')
			.editableList({
				addItem: function(container,_,opt) {
					const dataPoint: SuncronDataPoint = (opt as any).dataPoint || { event: 'midnight', offset: 0 }
					container.css({
						overflow: 'hidden',
						whiteSpace: 'nowrap',
						display: 'flex',
						'align-items': 'center'
					})
					const inputRows = $('<div></div>',{style:'flex-grow:1'})
						.appendTo(container)

					const row1 = $('<div></div>',{style:'display: flex;'})
						.appendTo(inputRows)
					row1.append($('<label><i class="fa fa-clock-o"></i> Event</label>'))
					const eventPicker = $('<select/>',{style:'width:120px; text-align: center;'})
						.appendTo(row1)
					for (const event of events) {
						eventPicker.append($('<option></option>', {selected:(dataPoint.event == event)})
							.val(event)
							.text(event))
					}

					const row2 = $('<div></div>',{style:'display: flex; padding-top: 5px;'})
						.appendTo(inputRows)
					row2.append($('<label><i class="fa fa-sliders"></i> Offset[min]</label>'))
					row2.append($('<input/>', {type:'number'})
						.val(dataPoint.offset))
				},
				sortable: true,
				removable: true
			})

		for (const dataPoint of node.dataPoints) {
			$('#node-input-rule-container').editableList('addItem',{dataPoint})
		}
	},
	oneditsave: function() {
		const node = this
		const dataPoints = $('#node-input-rule-container').editableList('items')
		node.dataPoints = []
		for (const dataPoint of dataPoints) {
			node.dataPoints.push(exportDataPoint(dataPoint))
		}
		$('#node-input-outputs')
			.val(node.dataPoints.length > 1 ? node.dataPoints.length - 1 : 0)
	},
	oneditresize: function(size) {
		const rows = $('#dialog-form>div:not(.node-input-rule-container-row)')
		let height = size.height
		for (const row of rows) {
			height -= $(row).outerHeight(true) || 0
		}
		const editorRow = $('#dialog-form>div.node-input-rule-container-row')
		height -= (parseInt(editorRow.css('marginTop'))+parseInt(editorRow.css('marginBottom')))
		height += 16
		$('#node-input-rule-container').editableList('height',height)
	}
})
