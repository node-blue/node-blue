# Node-BLUE

Write your automations for Home Assistant in JavaScript using a modern, intuitive API.

# Usage

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
