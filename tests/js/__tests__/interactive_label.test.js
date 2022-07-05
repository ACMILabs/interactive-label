/**
 * @jest-environment jsdom
 */

window.data = {};
window.data.playlist_labels =
  require("../../data/playlist.json").playlist_labels;
window.data.background = require("../../data/playlist.json").background;
window.data.background_dimensions =
  require("../../data/playlist.json").background_dimensions;

global.EventSource = function dummyEventSource() {};

document.body.innerHTML = "<div id='root'></div>";
require("../../../app/static/app");

it("displays expected tap to collect text", () => {
  const collectElement = document.getElementsByClassName("modal_collect")[0];
  expect(collectElement.innerHTML).toBe("TO COLLECT TAP LENS ON READER");
});

it("displays expected tap to select notification text", () => {
  const notificationElement =
    document.getElementsByClassName("notification_bar")[0];
  expect(notificationElement.innerHTML).toBe(
    "<p>Tap an object to learn more</p>"
  );
});
