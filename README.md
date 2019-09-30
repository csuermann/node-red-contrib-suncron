# SunCron

A Node-RED node that can output configurable messages at significant sun events

## Supported Sun Events

- Sunrise
- Sunrise End
- Golden Hour End
- Solar Noon
- Golden Hour
- Sunset Start
- Sunset
- Dusk
- Nautical Dusk
- Night
- Nadir
- Night End
- Nautical Dawn
- Dawn

## Configuration

For each of the above sun events a distinct `msg.payload` and `msg.topic` can be configured. It is also possible to specify an offset to adjust the event time.

The location (lat / lon) can either be entered manually or retrieved automatically via the location button.

![example](docs/config.png)

## Outgoing messages

The node will eject messages at the specified times (respecting offsets), which will have a `msg.payload` and `msg.topic` as configured in the editor. Outgoing messages also have a `schedule` attribute containing an object with details about the schedule of the current date. The schedule contains only events which have been configured with a payload.

Each event has the following attributes:

- `event` is the name of the sun event
- `sunEventTime` refers to the unadjusted time of the respective sun event.
- `cronTime` refers to the adjusted time, i.e. taking the offset into account.
- `offset` referst to the configured offset in seconds.

### Example `msg.schedule` object

```javascript
{
  "sunrise": {
      "event": "sunrise",
      "sunEventTime": "2019-09-08T06:29:51",
      "cronTime": "2019-09-08T07:31:51",
      "offset": 0
  },
  "sunriseEnd": {
      "event": "sunriseEnd",
      "sunEventTime": "2019-09-08T06:33:24",
      "cronTime": "2019-09-08T03:33:24",
      "offset": 3600
  },
  "dawn": {
      "event": "dawn",
      "sunEventTime": "2019-09-08T05:54:49",
      "cronTime": "2019-09-08T06:54:49",
      "offset": -600
  }
  //...
}
```

## Contributions and Suggestions

... are always welcome! Just file a GitHub [issue](https://github.com/csuermann/node-red-contrib-suncron/issues) or [pull request](https://github.com/csuermann/node-red-contrib-suncron/pulls)!
