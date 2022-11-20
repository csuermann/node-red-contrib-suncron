import * as NodeRED from 'node-red'
import dayjs from 'dayjs'
import { SunEvent } from './SuncronLocationDef'

export interface SuncronConfig extends NodeRED.NodeDef {
	location: string
	sunEventType: SunEvent
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
