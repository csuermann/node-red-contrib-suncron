const CronJob = require('cron').CronJob
const dayjs = require('dayjs')
const SunCalc = require('suncalc')

module.exports = function (RED) {
  function SuncronNode (config) {
    RED.nodes.createNode(this, config)

    const node = this
    let crons = []

    const debug = function (debugMsg) {
      if (RED.settings.suncronDebug) {
        node.warn(debugMsg)
      }
    }

    const setNodeStatus = function (text) {
      node.status({
        fill: 'grey',
        shape: 'dot',
        text: text
      })
    }

    const scheduleWindowCrons = function () {
      stopCrons()

      const now = dayjs()
      const begin = dayjs(now.format('YYYY-MM-DD') + 'T' + config.windowBegin)
      const end = dayjs(now.format('YYYY-MM-DD') + 'T' + config.windowEnd)
      const windowBeginCronCallback = function () {
        const schedule = stripPastBlocks(createSchedule(config))
        debug(schedule)
        const currentBlock = schedule.shift()
        executeBlock(currentBlock)
        scheduleMsgCrons(schedule)
      }

      if (isNowWithinWindow()) {
        windowBeginCronCallback()
      } else {
        setNodeStatus(`next cycle: ${begin.format('HH:mm')}`)
      }

      windowBeginCron = new CronJob({
        cronTime: `0 ${begin.minute()} ${begin.hour()} * * *`, // sec min hour dom month dow
        onTick: windowBeginCronCallback
      })
      windowBeginCron.start()

      windowEndCron = new CronJob({
        cronTime: `0 ${end.minute()} ${end.hour()} * * *`, // sec min hour dom month dow
        // cronTime: fakeCronTime,
        onTick: () => {
          setNodeStatus('cycle completed')
        }
      })
      windowEndCron.start()

      debug(
        `window crontabs set up for ${begin.format('HH:mm')} and ${end.format(
          'HH:mm'
        )}`
      )
    }

    const stopCrons = function () {
      if (crons.length > 0) {
        crons.forEach(cron => {
          cron.stop()
        })

        debug(`${crons.length} crons deleted`)
        crons = []
      }
    }

    const ejectMsg = function (isOn) {
      const castPayload = (payload, payloadType) => {
        if (payloadType === 'num') {
          return Number(payload)
        } else if (payloadType === 'bool') {
          return payload === 'true'
        } else if (payloadType === 'json') {
          return JSON.parse(payload)
        } else {
          return payload
        }
      }

      let payload = isOn ? config.onPayload : config.offPayload
      let payloadType = isOn ? config.onPayloadType : config.offPayloadType

      node.send({
        topic: isOn ? config.onTopic : config.offTopic,
        payload: castPayload(payload, payloadType)
      })
    }

    node.on('close', function () {
      stopCrons()
    })
    ;(function () {
      // on startup:
      setNodeStatus('initializing...')
      let today = new Date()
      let times = SunCalc.getTimes(today, 52.479867, 13.336637)
      let sunset = new Date(times.sunset)

      debug('SUNSET: ' + sunset)
      debug('TODAY: ' + today)
      debug(times)
      // console.log(times)
    })()
  }

  RED.nodes.registerType('suncron', SuncronNode)
}
