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
| `p, --port`   | `HASS_PORT`     | Specify which port to use when connecting to your Home Assistant Instance | `8123`  |
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

### Examples

The following is just a subset of what's possible. Please refer to the API definition to learn about the possibilities in more detail.

```js
// Do something for every single change on the provided entity:
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .do(() => {
            console.log("One of light.living_room's attributes has changed!");
        });

// Do something for every single state change on the provided entity:
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .state()
        .do(() => {
            console.log("light.living_room's state has changed!");
        });

// Do something only when the entity changes to the provided state:
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .to("on")
        .do(() => {
            console.log("light.living_room has changed to 'on'!");
        });

// Do something only when the entity changes from a provided state
// into another provided state:
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .from("off")
        .to("on")
        .do(() => {
            console.log("light.living_room has changed from 'off' to 'on'!");
        });

// Do something 5 seconds after the provided entity has changed to
// the provided state:
exports.node = (when) =>
    when("light.living_room")
        .changes()
        .to("on")
        .for(5, "seconds")
        .do(() => {
            console.log("light.living_room turned on five seconds ago!");
        });

// Or, write your own implementation:
exports.node = (when) =>
    when(() => {
        // Do whatever you want...
        return true;
    }).do(() => {
        console.log("when the code evaluates to true, this is executed!");
    });
```

## API

TODO: write API documentation.

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

-   [ ] Release first version and publish to NPM
-   [ ] Handle newly added, updated, or changed nodes at runtime
-   [ ] Improve typing throughout
-   [ ] Generate and export type declarations
-   [ ] Handle errors more gracefully
-   [ ] Add some colour to the CLI's output?
-   [ ] Get to doing those todo's in the code
