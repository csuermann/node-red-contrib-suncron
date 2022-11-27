type SuncronDataPoint = import('../SunTimeOfDayDef').SuncronDataPoint

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDisplayName(dataPoint: SuncronDataPoint): string {
	if (dataPoint.offset == 0) {
		return dataPoint.event
	} else {
		const sign = dataPoint.offset > 0 ? '+' : '-'
		const offset = Math.abs(dataPoint.offset)
		const hour = Math.floor(offset / 60)
		const min = offset % 60
		if (dataPoint.event == 'midnight' && dataPoint.offset > 0) {
			return `${hour}:${min.toLocaleString(undefined, {minimumIntegerDigits: 2})}`
		}
		let name = dataPoint.event + ' ' + sign
		if (hour > 0) {
			name += hour + 'h'
		}
		if (min > 0) {
			name += min + 'm'
		}
		return name
	}
}
