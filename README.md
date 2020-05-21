# Node-BLUE

Write your automations for Home Assistant in JavaScript using a modern, intuitive API.

## Installation

Node-BLUE requires Node.js version 12 or above. To install, run the following command from any directory in your terminal:

```sh
$ npm i -g node-blue
```

## Usage

Installing the CLI globally provides access to the `node-blue` command.

```sh
$ node-blue [command]

# Run `help` for detailed information about the CLI
$ node-blue help

# Run `start` to start the main application
$ node-blue start [nodes]
```

`node-blue start` takes a single argument of a path to a directory Node-BLUE should watch for `nodes`. By default `./nodes` is used.

The CLI exposes the following options. All options may also be set by environment variables. CLI options take precedence over environment variables.

| CLI option    | .env equivalent | details                                                                   | default |
| ------------- | --------------- | ------------------------------------------------------------------------- | ------- |
| `-h, --host`  | `HASS_HOST`     | Specify your Home Assistant host                                          |         |
| `-t, --token` | `HASS_TOKEN`    | Specify a long-lived access token for your Home Assistant instance        |         |
| `-p, --port`  | `HASS_PORT`     | Specify which port to use when connecting to your Home Assistant Instance | `8123`  |
| `-s, --s`     | `HASS_SECURE`   | Connect to Home Assistant using the `wss` protocol                        | `false` |

### `nodes`

A "node" is an entity that contains a set of rules which, when evaluated, result in a function being called. Each node is to export
a single function, which is passed the `when` object. This function should return an event handler. It is stronly advised to use the
`when` object to construct this handler.

Your `node` files should look like this:

```js
exports.node = (when) => when('light.living_room).changes('state').do(() => {
    console.log("light.living_room's state just changed!);
});
```

## API

### `when`

#### Arguments

`when` takes a single argument, either:

-   a `string`, representing a Home Assistant `entity_id`, or
-   a `function`, in which the user writes their own logic to determine whether the automation should run

Note that if a function is passed:

-   it to return a `boolean`, and
-   no further filtering is possible. After passing a function into `when`, the next call should be `do()`.

The function passed into `when` will be called with two arguments:

-   `event`, the raw event from Home Assistant to determine whether to react to or not, and
-   `toolkit`, a collection of tools to interact with the connected Home Assistant instance.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .do(() => {
            // Called when any of `light.living_room`'s attributes change
        });

// For more information on the `for` and `do`calls, please refer to their respective documentation
```

```js
exports.node = (when) =>
    when((event, toolkit) => {
        // Do whatever, just remember to return a `boolean`
        return true;
    }).do(() => {
        // This is called because `true` was returned!
    });
```

### `changes`

#### Arguments

`changes` takes one optional argument:

-   a `string`, representing a dot-notated path to the field within the entity specified in `when` has to be changed.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .do(() => {
            // Called when any of `light.living_room`'s attributes change
        });
```

```js
exports.node = (when) =>
    when("light.living_room")
        .changes("state")
        .do(() => {
            // Called when `light.living_room`'s state changes
        });
```

### `from`

#### Arguments

`from` takes a single required argument and an optional second argument:

-   a `string` representing the value that the entity should have changed _from_, and
-   an optional `string` representing a dot-notated path to the field within the entity passed into `when` that the value previously specified should have changed _from_. This option defaults to `state`.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .changes("state")
        .from("off")
        .do(() => {
            // Called when light.living_room's state changes from "off" to a different value
        });
```

### `to`

#### Arguments

`to` takes a single required argument and an optional second argument:

-   a `string` representing the value that the entity should have changed _to_, and
-   an optional `string` representing a dot-notated path to the field within the entity passed into `when` that the value previously specified should have changed _to_. This option defaults to `state`.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .changes("state")
        .to("off")
        .do(() => {
            // Called when light.living_room's state changes to "off"
        });
```

### `for`

`for` is used to make sure a certain changes is persisted for a certain amount of time before calling `do`. It takes one required argument and an optional argument:

-   a `number`, representing the size of the delay, and
-   a `string`, representing the unit of the delay. Currently, the following units are supported: `milliseconds`, `seconds`, `minutes`, `hours`, with `milliseconds` being the default.

### `do`

`do` should always be the last thing you call. It takes a single required argument:

-   a `function` that will be called of all of the previously specified rules (or the function you passed into `when`) evaluate to `true`.

The function passed into `do` will be called with two arguments:

-   `event`, the raw event from Home Assistant to determine whether to react to or not, and
-   `toolkit`, a collection of tools to interact with the connected Home Assistant instance.

### `event`

Please refer to the [Home Assistant WebSocket API documentation](https://developers.home-assistant.io/docs/api/websocket/#subscribe-to-events).

### `toolkit`

The toolkit currently exposes the following functions:

-   `callService`: Please refer to the [calling a service](https://developers.home-assistant.io/docs/api/websocket/#calling-a-service) section of the Home Assistant WebSocket API documentation.
-   `entity`: Handy wrapper that takes an `entity_id` and returns the corresponding object or `undefined` if it does not exist.
-   `states`: Please refer to the [fetching states](https://developers.home-assistant.io/docs/api/websocket/#fetching-states) section of the Home Assistant WebSocket API documentation.

## Development

First, get the source code and install dependencies:

```sh
$ git clone https://github.com/node-blue/node-blue
$ cd node-blue
$ npm i
```

Then, watch for changes and have the CLI rebuild and restart accordingly (recommended):

```sh
# In one terminal:
$ npm run build:watch

# In another:
$ npm run dev
```

Alternatively, build and run once:

```sh
$ npm start
```

Or run `npm run build` yourself and use the CLI afterwards.

All of the scripts above configure the CLI to read from the `.test` folder instead of the usual default.

## TODO

-   [ ] Handle newly added, updated, or changed nodes at runtime
-   [ ] Improve typing throughout
-   [ ] Generate and export type declarations
-   [ ] Handle errors more gracefully
-   [ ] Add some colour to the CLI's output?
-   [ ] Get to doing those todo's in the code
