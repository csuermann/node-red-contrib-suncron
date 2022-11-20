// https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/function/10-switch.html
// https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/function/10-switch.js
import * as NodeRED from 'node-red'
import { SuncronLocationState } from './SuncronLocationDef'
import { SunTimeOfDayConfig } from './SunTimeOfDayDef'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType('sun-time-of-day',
		function (this: NodeRED.Node, config: SunTimeOfDayConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			const location = RED.nodes.getNode(config.location) as NodeRED.Node<SuncronLocationState>
			node.on('input', function(msg) {
				// TODO
			})
		}
	)
}
