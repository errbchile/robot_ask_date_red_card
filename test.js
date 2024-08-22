const player = require("play-sound")();

player.play("alarm.mp3", function (err) {
  if (err) throw err;
});

console.log("playing alarm. You should be hearing right now. Adjust volume.");

console.log("Press 'ctrl + c' to exit");
