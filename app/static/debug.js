const debugRoot = document.getElementById("root");

const screenTouchedIcon = document.createElement("div");
debugRoot.appendChild(screenTouchedIcon);
screenTouchedIcon.className = "screen_touched_icon";

/** Show where the user last clicked */
function debugTouchscreenEvent(event) {
  const mouseX = event.clientX - screenTouchedIcon.offsetWidth / 2;
  const mouseY = event.clientY - screenTouchedIcon.offsetHeight / 2;

  screenTouchedIcon.style.left = `${mouseX}px`;
  screenTouchedIcon.style.top = `${mouseY}px`;
}

document.addEventListener("touchstart", debugTouchscreenEvent);
document.addEventListener("click", debugTouchscreenEvent);
