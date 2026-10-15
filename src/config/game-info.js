// What the Library Game Hub shows about YOUR game (Hub Contract, rule 1).
// Lab Step 6: replace every CHANGE_ME value with your own.
const pkg = require('../../package.json');

module.exports = {
  slug: 'bomb-pass',            // your group's game, lower case with hyphens, for example shelf-climb
  name: 'Bomb Pass',            // the name players will see
  team: 'Bomb Pass Team (Group 7)', // your group's name and section, for example Bookworms (3-1)
  developer: 'dvlDweller',       // YOUR GitHub username: this build is yours
  description: 'A multiplayer MC quiz game where wrong answers or timeouts lock the bomb pass.', // one sentence about how the game is played
  min_players: 3,               // change to the limits your game is designed for
  max_players: 15,
  version: pkg.version,         // read from package.json, do not edit here
};
