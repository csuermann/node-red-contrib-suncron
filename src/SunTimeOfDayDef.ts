import * as NodeRED from 'node-red'
import * as EditorClient from '@node-red/editor-client'
import { SunEvent } from './SuncronLocationDef'

export interface SunTimeOfDayDataPoint {
	event: SunEvent | 'midnight'
	offset: number
}

export interface SunTimeOfDayRuntimeConfig extends SunTimeOfDayConfig, NodeRED.NodeDef {}
export interface SunTimeOfDayEditorConfig extends SunTimeOfDayConfig, EditorClient.NodeProperties {}
interface SunTimeOfDayConfig {
	location: string
	dataPoints: Array<SunTimeOfDayDataPoint>
}
