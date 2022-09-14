const root = document.getElementById("root");

const screenTouchedIcon = document.createElement("div");
root.appendChild(screenTouchedIcon);
screenTouchedIcon.className = "screen_touched_icon";

/** Show where the user last clicked */
function debugTouchscreenEvent(event) {
  const mouseX = event.clientX - 15; // Minus half the width of the icon
  const mouseY = event.clientY - 15; // Minus half the height of the icon

  screenTouchedIcon.style.left = `${mouseX}px`;
  screenTouchedIcon.style.top = `${mouseY}px`;
}

document.addEventListener("touchstart", debugTouchscreenEvent);
document.addEventListener("click", debugTouchscreenEvent);
