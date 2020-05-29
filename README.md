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

`node-blue start` takes a single (optional) argument of a path to a directory Node-BLUE should watch for [`nodes`](#nodes). By default `./nodes` is used.

`node-blue start` accepts the following options. All options may also be set by environment variables. CLI options take precedence over environment variables.

| CLI option    | .env equivalent | details                                                                   | default          |
| ------------- | --------------- | ------------------------------------------------------------------------- | ---------------- |
| `-h, --host`  | `HASS_HOST`     | Specify your Home Assistant host                                          | `hassio.local`   |
| `-P, --path`  | `HASS_PATH`     | Specify the path to the Websocket API on your Home Assistant instance     | `/api/websocket` |
| `-p, --port`  | `HASS_PORT`     | Specify which port to use when connecting to your Home Assistant Instance | `8123`           |
| `-s, --s`     | `HASS_SECURE`   | Connect to Home Assistant using the `wss` protocol                        | `false`          |
| `-t, --token` | `HASS_TOKEN`    | Specify a long-lived access token for your Home Assistant instance        |                  |

### `nodes`

A "node" is an entity that contains a set of rules which, when evaluated, result in a function being called. Each node is to export
a single function, which is passed the [`when`](#when) object and a [toolkit](#toolkit). This function should return an event handler.

Your `node` files could look like this:

```js
exports.node = (when, toolkit) =>
    when("light.living_room")
        .changes("state")
        .do((event) => {
            console.log("light.living_room's state just changed!");
        });
```

The minimum requirement is a single call to `when`, followed by a call to `do`.

## API

### `when`

#### Arguments

`when` takes a single optional argument, either:

-   a `string`, representing a Home Assistant `entity_id`, or
-   a `function`, in which the user writes their own logic to determine whether the automation should run

Note that if a function is passed:

-   it to return a `boolean`,
-   no further filtering is possible. After passing a function into `when`, the next call should be `do()`, and
-   it's fine to return a promise, as long as it resolves to a `boolean`.

The function passed into `when` will be called with a single argument:

-   `event`, the raw event from Home Assistant to determine whether to react to or not

Note that if `when` is passed no parameter, it will respond to every single event.

#### Examples

```js
exports.node = (when, toolkit) =>
    when("light.living_room")
        .changes()
        .do(() => {
            // Called when any of `light.living_room`'s attributes change
        });

// For more information on the `for` and `do`calls, please refer to their respective documentation
```

```js
exports.node = (when, toolkit) =>
    when((event) => {
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

Note that if nothing is passed in, Node-BLUE will react to any change to the previously specified entity.

Note that calling `changes` only works when a string was passed into `when`.

#### Examples

```js
exports.node = (when, toolkit) =>
    when("light.living_room")
        .changes()
        .do(() => {
            // Called when any of `light.living_room`'s attributes change
        });
```

```js
exports.node = (when, toolkit) =>
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

```js
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .from("off", "state")
        .do(() => {
            // This is the equivalent of the example above, although slightly less readable
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

```js
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .to("off", "state")
        .do(() => {
            // Called when light.living_room's state changes to "off"
        });
```

### `turns`

`turns` takes a single required argument:

-   a `string` representing the value that the entity's state should have changed _to_.

`turns` is short for calling `changes().to()`.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .turns("on")
        .do(() => {
            // Called when light.living_room turns on!
        });
```

### `switches`

This is an alias for [`turns`](#turns).

### `becomes`

This is an alias for [`turns`](#turns).

### `for`

`for` is used to make sure a certain changes is persisted for a certain amount of time before calling `do`. It takes one required argument and an optional argument:

-   a `number`, representing the size of the delay, and
-   a `string`, representing the unit of the delay. Currently, the following units are supported: `milliseconds`, `seconds`, `minutes`, `hours`, with `milliseconds` being the default.

#### Examples

```js
exports.node = (when) =>
    when("light.living_room")
        .changes("state")
        .to("on")
        .for(5, "seconds")
        .do(() => {
            // Called when light.living_room has been on for 5 seconds!
            // If light.living_room turns off within 5 seconds after turning on,
            // this will not be called
        });
```

### `do`

`do` should always be the last thing you call. It takes a single required argument:

-   a `function` that will be called of all of the previously specified rules (or the function you passed into `when`) evaluate to `true`.

The function passed into `do` will be called with two arguments:

-   `event`, the raw event from Home Assistant

Note that this function does not have to return anything, and it's absolutely fine to turn is this into an async function.

### `event`

Please refer to the [Home Assistant WebSocket API documentation](https://developers.home-assistant.io/docs/api/websocket/#subscribe-to-events).

### `toolkit`

The toolkit is passed into the exposed function right after `when`. It currently exposes the following functions:

#### `call`

Easily call a Home Assistant service. Usage:

```js
call("light.living_room.turn_on");

call("light.living_room.turn_on", { brightness: 0.5 });

call("light.turn_on", { entity_id: "light.living_room" });
```

#### `diff`

Pass it the event and it will create a difference report on the old state and the new state of the entity, or, pass it two objects, and it will compare those. Usage:

```js
diff(event);

diff(objectA, objectB);
```

#### `entity`

Handy wrapper that takes an `entity_id` and returns the corresponding object or `undefined` if it does not exist. Usage:

```js
entity("light.living_room");
```

#### `entities`

Handy wrapper that takes any number of `entity_id`'s as arguments, and returns the corresponding objects in an array. Usage:

```js
entities("light.living_room", "light.kitchen", "sun.sun");
```

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
