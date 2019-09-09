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

## Contributions and Suggestions

... are always welcome! Just file a GitHub [issue](https://github.com/csuermann/node-red-contrib-suncron/issues) or [pull request](https://github.com/csuermann/node-red-contrib-suncron/pulls)!
