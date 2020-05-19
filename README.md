# Node-BLUE

Write your automations for Home Assistant in JavaScript using a modern, intuitive API.

## Installation

Currently, this is a barebones node application. In the future, this may expose a CLI, and will evolve into providing a Hass.io Add-on.

For now, the only method of installation that is supported is the same method through which you would contribute.

## Development

1. Get the source code and install dependencies

```sh
$ git clone https://github.com/node-blue/node-blue
$ cd node-blue
$ npm i
```

2. Create a `.env` file containing the following:

```
HASS_URL=<your home assistant url>
HASS_TOKEN=<a long-lived access token>
```

3. Build and link the application:

```sh
$ npm run build
$ npm link
```

4. Create a different project in a separate folder and link `node-blue` as a dependency:

```sh
$ cd ../ # from the node-blue folder whe just cloned the repo into
$ mkdir node-blue-test
$ cd node-blue-test
$ npm init -y
$ npm link node-blue
```

5. Create an `index.js` importing the library and use it:

```js
const when = require("node-blue");

// Use the application, see usage examples
```

6. Run your application:

```sh
$ node index.js
```

## Usage

Consider the following usage examples:

```js
// Do something for every single change on the provided entity:
when("light.living_room")
    .changes()
    .do(() => {
        console.log("One of light.living_room's attributes has changed!");
    });

// Do something for every single state change on the provided entity:
when("light.living_room")
    .changes()
    .state()
    .do(() => {
        console.log("light.living_room's state has changed!");
    });

// Do something only when the entity changes to the provided state:
when("light.living_room")
    .changes()
    .to("on")
    .do(() => {
        console.log("light.living_room has changed to 'on'!");
    });

// Do something only when the entity changes from a provided state
// into another provided state:
when("light.living_room")
    .changes()
    .from("off")
    .to("on")
    .do(() => {
        console.log("light.living_room has changed from 'off' to 'on'!");
    });

// Do something 5 seconds after the provided entity has changed to
// the provided state:
when("light.living_room")
    .changes()
    .to("on")
    .for(5, "seconds")
    .do(() => {
        console.log("light.living_room turned on five seconds ago!");
    });

// Or, write your own implementation:
when(() => {
    // Do whatever you want...
    // ...
    // Just remember to return `true` or `false`
    return true;
}).do(() => {
    console.log("when the code evaluates to true, this is executed!");
});
```

## Roadmap / todo

-   [ ] Exporting typescript declarations
-   [ ] Rewrite Home Assistant communication layer
-   [ ] Expose a CLI
-   [ ] Provide toolkit in callback to actually interact with Home Assistant
-   [ ] Read from files (through CLI)
-   [ ] Hass.io Add-on
