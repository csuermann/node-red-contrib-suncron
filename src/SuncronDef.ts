import * as NodeRED from 'node-red'
import * as EditorClient from '@node-red/editor-client'
import dayjs from 'dayjs'

export interface SuncronRuntimeConfig extends SuncronConfig, NodeRED.NodeDef {}
export interface SuncronEditorConfig extends SuncronConfig, EditorClient.NodeProperties {}
interface SuncronConfig {
	location: string
	sunEventType: string
	payload: string
	payloadType: string
	topic: string
	offset: number
}

export interface SuncronEvent {
	cronTime: dayjs.Dayjs
	payload: string
	payloadType: string
	topic: string
}
