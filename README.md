# Node-BLUE

Node.js automation engine for Home Assistant.

## Installation

Node-BLUE requires Node.js version 12 or above. To install, run the following command from any directory in your terminal:

```sh
npm i -g node-blue
```

Looking for an easy way to integrate with Home Assistant? Try the [Hass.io Add-on](https://github.com/node-blue/hassio).

## Usage

### CLI

Installing the CLI globally provides access to the node-blue command.

```sh
$ node-blue [command]

# Run `help` for detailed information about the CLI
$ node-blue help

# Run `start` to start the main application
$ node-blue start [nodes]
```

`node-blue start` takes a single optional argument specifying the folder to watch for nodes. The command also accepts the following options (all of which may also be set through environment variables):

| CLI option     | .env equivalent | details                                                                   | default                    |
| -------------- | --------------- | ------------------------------------------------------------------------- | -------------------------- |
| `-h, --host`   | `HASS_HOST`     | Specify your Home Assistant host, including a port                        | `homeassistant.local:8123` |
| `-p, --path`   | `HASS_API_PATH` | Specify which port to use when connecting to your Home Assistant Instance | `/api/websocket`           |
| `-s, --secure` | `HASS_SECURE`   | Connect to Home Assistant using the `wss` protocol                        | `false`                    |
| `-t, --token`  | `HASS_TOKEN`    | Specify a long-lived access token for your Home Assistant instance        |                            |

### `nodes`

`node-blue` behaves like a test runner:

1. Within your files, you have access to a number of globally defined methods with which you'll handle Home Assistant events
2. You have access to full [`should.js`](https://github.com/shouldjs/should.js) assertions
3. Throwing from the `node` means not all conditions are met, and the remainder of the file is not executed

Consider the following usage example:

```js
node("example", (event, toolkit) => {
    event.entity_id.should.equal("light.living_room");
    event.new_state.state.should.equal("on");
    event.old_state.state.should.not.equal("on");

    console.log("light.living_room turned on!");
});
```

In this example, if one of the three assertions aren't met, the message will not be logged.

By the way, async functions are fully supported.

### Helper functions

In order the make things easier for you, we also provide the following functions globally:

#### `either` function

Simple function that takes two functions as arguments. Place your assertions in either functions. If one of the two functions does not throw, we continue execution of your `node`. If both throw, none of the conditions were met, so we stop execution. Example usage:

```js
node("either example", (event, toolkit) => {
    event.new_state.state.should.equal("on");
    event.old_state.state.should.not.equal("on");

    either(
        () => {
            event.entity_id.should.equal("light.living_room");
        },
        () => {
            event.entity_id.should.equal("light.kitchen");
        }
    );

    console.log("Either light.living_room or light.kitchen turned on!");
});
```

#### `fetch`

In case you need to make API calls to something other than Home Assistant, we expose `fetch` (based on [`node-fetch`](https://github.com/node-fetch/node-fetch)) globally.

### Toolkit

Besides passing in the Home Assistant event, the function you pass into `node` receives a second argument with a toolkit object that destructures to:

#### `call` function

Call any Home Assistant service. Returns a promise. Example usage:

```js
// These two calls are the same:
await call("light.living_room.turn_on");
await call("light.turn_on", { entity_id: "light.living_room" });

// Use the second argument to pass in any other service data:
await call("light.living_room.turn_on", { brightness: 0.5 });
```

#### `diff` function

Helper function to compute the difference between two objects. Uses [`recursive-diff`](https://github.com/cosmicanant/recursive-diff) under the hood. Example usage:

```js
// Passing it the Home Assistant event results in the difference between the old and the new state being returned:
diff(event);

// Passing it two objects will compare the objects:
diff({ a: true }, { a: false });
```

#### `entity` function

Quickly fetch the current state of an entity. Returns a promise that resolves to a Home Assistant entity object or undefined if the requested entity does not exist. Example usage:

```js
await entity("light.living_room"); // resolves to the `light.living_room` entity
await entity("light.does_not_exist"); // resolves to `undefined`
```

#### `entities` function

Similar to `entity`, but accepts an array of entity_id's to fetch at once. Returns a promise that resolves to an array of Home Assistant entity objects or undefined. Example usage:

```js
await entities("light.living_room", "light.does_not_exist");
// resolves to [`light.living_room` entity object, `undefined`]
```

## License

Node-BLUE is licensed under the [Apache 2.0 license](LICENSE).
