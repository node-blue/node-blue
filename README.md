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
$ node-blue start
```

By default, Node-BLUE will watch for so called "nodes" in the `nodes` folder within the folder where `node-blue` is called from.

### Nodes

A "node" is an entity that contains a set of rules which, when evaluated, result in a function being called. Each node is to export
a single function, which is passed the `when` object. This function should return an event handler. It is stronly advised to use the
`when` object to construct this handler.

```js
exports.node = (when) => when('light.living_room).changes('state').do(() => {
    console.log("light.living_room's state just changed!);
});
```

### `when`

The `when` object makes up most of Node-BLUE's API. Consider the following use cases:

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
        // ...
        // Just remember to return `true` or `false`
        return true;
    }).do(() => {
        console.log("when the code evaluates to true, this is executed!");
    });
```

## Development

1. Get the source code and install dependencies:

```sh
$ git clone https://github.com/node-blue/node-blue
$ cd node-blue
$ npm i
```

2. Build and run:

```sh
$ npm start
```

By default, in development, nodes are read from the `.test` folder.

Alternatively, you could run `npm run build` in one terminal, and directly use the CLI in another.

## TODO

-   [ ] Improve development experience with auto-reloading
-   [ ] Release first version and publish to NPM
-   [ ] Handle newly added, updated, or changed nodes at runtime
-   [ ] Improve typing throughout
-   [ ] Generate and export type declarations
-   [ ] Handle errors more gracefully
-   [ ] Add some colour to the CLI's output?
