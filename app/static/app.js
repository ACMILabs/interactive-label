/*
const debug_el = document.createElement('div')
debug_el.style.position = 'fixed'
debug_el.style.top = '0'
debug_el.style.right = '0'
debug_el.style.background = '#fff'
debug_el.style.zIndex = 1
document.body.appendChild(debug_el)

window.addEventListener('error', function (e) {
  debug_el.innerHTML += e.message +'. l'+ e.lineno +':c'+ e.colno
})
*/

function save_label(label_id) {
  // Save label selected to the local database for a tap
  fetch("http://localhost:8081/api/labels/", {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify({
      datetime: Date.now(),
      label_id,
    }),
  }).then((response) => response.json());
}

// CONTENT

const labels = window.data.playlist_labels.map(function playlist_labels_map(x) {
  return {
    id: x.label.id,
    title: x.label.title,
    title_annotation: x.label.work ? x.label.work.title_annotation : null,
    publication: x.label.subtitles,
    description_column_1: x.label.columns[0].content,
    description_column_2: x.label.columns[1].content,
    description_column_3: x.label.columns[2].content,
    description_style_1: x.label.columns[0].style,
    description_style_2: x.label.columns[1].style,
    description_style_3: x.label.columns[2].style,
    video_url: x.resource,
    subtitles: `data:text/vtt;base64,${btoa(x.subtitles)}`,
    images: x.label.images,
    is_context_indigenous: x.label.work
      ? x.label.work.is_context_indigenous
      : false,
    is_group: x.label.work ? x.label.work.record_type === "group" : false,
  };
});

// STATE

const modals = [];
const left_cols = [];
let active_collect_element = null;
let is_animating_collect = false;
const collect_elements = [];
let current_modal = null;
const COLLECT_TEXT = "TO COLLECT TAP LENS ON READER";
const NOTIFICATION_TEXT = "Tap an object to learn more";
const LARGE_TEXT = "LARGE TEXT";
const NOTIFICATION_BAR_TIMEOUT = 20000;
const MODAL_TIMEOUT = 60000;

const active_images = [];
for (let i = 0; i < labels.length; i++) {
  active_images[i] = new Array(labels[i].images.length);
}
let current_active_image = null;

// DOM

const root = document.getElementById("root");

const background = document.createElement("div");
root.appendChild(background);
background.className = "background";

function no_background() {
  const error = document.createElement("div");
  error.className = "error";
  error.innerHTML = `No background`;
  document.body.innerHTML = "";
  document.body.appendChild(error);
}

if (!window.data.background) {
  no_background();
} else {
  fetch(window.data.background, { mode: "no-cors" })
    .then(function make_background() {
      background.style.backgroundImage = `url(${window.data.background})`;
    })
    .catch(no_background);
}

let active_path = null;
const modal_cont = document.createElement("div");
modal_cont.className = "modal_cont";
root.appendChild(modal_cont);

function open_large_text() {
  const textBox = current_modal.querySelectorAll("[class^=modal_left_col_]")[0];
  const largeTextButton =
    current_modal.getElementsByClassName("large_text_button")[0];
  if (largeTextButton.innerHTML === LARGE_TEXT) {
    largeTextButton.innerHTML = "";
    largeTextButton.classList.add("large_text_button_close");
    textBox.classList.add("large_text");
    for (let index = 0; index < textBox.children.length; index++) {
      const element = textBox.children[index];
      const cssFontSize =
        getComputedStyle(element).getPropertyValue("font-size");
      const fontSize = parseFloat(cssFontSize);
      element.style.fontSize = `${fontSize * 1.5}px`;
      const cssLineHeight =
        getComputedStyle(element).getPropertyValue("line-height");
      const lineHeight = parseFloat(cssLineHeight);
      element.style.lineHeight = `${lineHeight * 1.5}px`;
    }
  }
}

function close_large_text() {
  const textBox = current_modal.querySelectorAll("[class^=modal_left_col_]")[0];
  const largeTextButton =
    current_modal.getElementsByClassName("large_text_button")[0];
  if (largeTextButton.innerHTML === "") {
    largeTextButton.innerHTML = LARGE_TEXT;
    largeTextButton.classList.remove("large_text_button_close");
    textBox.classList.remove("large_text");
    for (let index = 0; index < textBox.children.length; index++) {
      const element = textBox.children[index];
      const cssFontSize =
        getComputedStyle(element).getPropertyValue("font-size");
      const fontSize = parseFloat(cssFontSize);
      element.style.fontSize = `${fontSize / 1.5}px`;
      const cssLineHeight =
        getComputedStyle(element).getPropertyValue("line-height");
      const lineHeight = parseFloat(cssLineHeight);
      element.style.lineHeight = `${lineHeight / 1.5}px`;
    }
  }
}

function toggle_large_text() {
  const largeTextButton =
    current_modal.getElementsByClassName("large_text_button")[0];
  if (largeTextButton.innerHTML === LARGE_TEXT) {
    open_large_text();
  } else {
    close_large_text();
  }
}

function setPanZoom(element) {
  // eslint-disable-next-line no-undef
  panzoom(element, {
    bounds: true,
    boundsPadding: 0.5,
    minZoom: 1,
    maxZoom: 5,
  });
}

function close_modal() {
  close_large_text();
  current_modal.style.opacity = 0;
  current_modal.style.pointerEvents = "none";
  modal_cont.style.opacity = 0;
  modal_cont.style.pointerEvents = "none";
  if (current_active_image) {
    current_active_image.style.opacity = 0;
    current_active_image.style.visibility = "hidden";
    setPanZoom(current_active_image.firstChild);
  }
  active_collect_element = null;
  active_path.classList.remove("active");
  active_path = null;
  current_modal = null;
  save_label(null);
}

const notification_bar = document.createElement("div");
notification_bar.className = "notification_bar";
notification_bar.innerHTML = `<p>${NOTIFICATION_TEXT}</p>`;
root.appendChild(notification_bar);

function open_notification_bar() {
  notification_bar.style.top = "0px";
}

function close_notification_bar() {
  notification_bar.style.top = `-${notification_bar.clientHeight}px`;
}

notification_bar.addEventListener("click", close_notification_bar);

let close_timer = null;
function handle_timer_timeout() {
  if (current_modal) {
    close_modal();
  }
}
let close_notification_bar_timer = null;
function handle_notification_bar_timer_timeout() {
  if (!current_modal) {
    open_notification_bar();
  } else {
    window.clearTimeout(close_notification_bar_timer);
    close_notification_bar_timer = window.setTimeout(
      handle_notification_bar_timer_timeout,
      NOTIFICATION_BAR_TIMEOUT
    );
  }
}
close_notification_bar_timer = window.setTimeout(
  handle_notification_bar_timer_timeout,
  NOTIFICATION_BAR_TIMEOUT
);
window.addEventListener("click", function () {
  window.clearTimeout(close_timer);
  close_timer = window.setTimeout(handle_timer_timeout, MODAL_TIMEOUT);
  window.clearTimeout(close_notification_bar_timer);
  close_notification_bar();
  close_notification_bar_timer = window.setTimeout(
    handle_notification_bar_timer_timeout,
    NOTIFICATION_BAR_TIMEOUT
  );
});

function setModalTimeout(milliseconds) {
  window.clearTimeout(close_timer);
  close_timer = window.setTimeout(handle_timer_timeout, milliseconds);
}

const modal_blind = document.createElement("div");
modal_blind.className = "modal_blind";
modal_cont.appendChild(modal_blind);
modal_blind.addEventListener("click", close_modal);

for (let i = 0; i < labels.length; i++) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal_cont.appendChild(modal);
  modals[i] = modal;
}

for (let i = 0; i < labels.length; i++) {
  const label = labels[i];

  // If there are 3 columns don't show images on the label.
  // If there are 2 columns, only show the first, main image on the label.
  // If there is 1 column, show the main image and the image list (pulled from the works)
  let num_description_columns;
  if (label.description_column_3.length) {
    num_description_columns = 3;
  } else if (label.description_column_2.length) {
    num_description_columns = 2;
  } else {
    num_description_columns = 1;
  }

  const should_show_image_list =
    label.images.length > 1 && num_description_columns === 1;
  const should_show_image_and_caption = num_description_columns < 3;

  const item = document.createElement("div");
  modals[i].appendChild(item);
  item.className = "modal_item";

  const left_col = document.createElement("div");
  left_cols[i] = left_col;
  item.appendChild(left_col);
  left_col.className = `modal_left_col_${num_description_columns}`;

  const large_text_button_container = document.createElement("div");
  large_text_button_container.className = "large_text_button_container";
  left_col.appendChild(large_text_button_container);
  const large_text_button = document.createElement("div");
  large_text_button_container.appendChild(large_text_button);
  large_text_button.className = "large_text_button";
  large_text_button.innerHTML = LARGE_TEXT;
  large_text_button_container.addEventListener("click", toggle_large_text);

  const title = document.createElement("div");
  left_col.appendChild(title);
  title.className = "modal_title";
  title.innerHTML = label.title;

  if (label.title_annotation) {
    const title_annotation = document.createElement("span");
    title_annotation.className = "modal_title_annotation";
    title_annotation.innerHTML = label.title_annotation;
    title.innerHTML = title.innerHTML.replace(
      /<\/p>/g,
      `${title_annotation.outerHTML}</p>`
    );
  }

  const publication = document.createElement("div");
  left_col.appendChild(publication);
  publication.className = "modal_publication";
  publication.innerHTML = label.publication;

  const description_1 = document.createElement("div");
  left_col.appendChild(description_1);
  description_1.className = `
    modal_description
    modal_desc_col_${num_description_columns}
    ${label.description_style_1 === "smaller" ? "modal_small_description" : ""}
  `;
  description_1.innerHTML = label.description_column_1;
  if (label.is_context_indigenous) {
    const img_el = document.createElement("img");
    img_el.className = "indigenous_image";
    img_el.src = "/static/indigenous.png";
    description_1.prepend(img_el);
  }

  if (num_description_columns > 1) {
    const description_2 = document.createElement("div");
    left_col.appendChild(description_2);
    description_2.className = `
      modal_description
      modal_desc_col_${num_description_columns}
      ${
        label.description_style_2 === "smaller" ? "modal_small_description" : ""
      }
    `;
    description_2.innerHTML = label.description_column_2;
  }

  if (num_description_columns === 3) {
    const description_3 = document.createElement("div");
    left_col.appendChild(description_3);
    description_3.className = `
      modal_description
      modal_desc_col_${num_description_columns}
      ${
        label.description_style_3 === "smaller" ? "modal_small_description" : ""
      }
    `;
    description_3.innerHTML = label.description_column_3;
  }

  const image_container = document.createElement("div");
  item.appendChild(image_container);
  image_container.className = "modal_image_container";

  const active_image_cont = document.createElement("div");
  if (should_show_image_and_caption) {
    image_container.appendChild(active_image_cont);
    active_image_cont.className = `modal_active_image_cont ${
      num_description_columns === 1 ? "large_image_cont" : ""
    }`;
  }

  const back_button = document.createElement("div");
  item.appendChild(back_button);
  back_button.className = "modal_back_button";
  back_button.innerHTML = "BACK";
  back_button.addEventListener("click", close_modal);

  const collect = document.createElement("div");
  item.appendChild(collect);
  collect.className = "modal_collect";
  collect.innerHTML = COLLECT_TEXT;
  collect_elements.push(collect);

  const close = document.createElement("div");
  item.appendChild(close);
  close.className = "modal_close";
  close.innerHTML = "";
  close.addEventListener("click", close_modal);

  for (let j = 0; j < label.images.length; j++) {
    const label_image = label.images[j];

    if (should_show_image_and_caption) {
      const active_image_and_caption = document.createElement("div");
      active_image_cont.appendChild(active_image_and_caption);
      active_image_and_caption.className = "modal_active_image_and_caption";
      active_images[i][j] = active_image_and_caption;
      active_image_cont.style.overflow = "hidden";

      const active_image = document.createElement("div");
      active_image_and_caption.appendChild(active_image);
      active_image.className = "modal_active_image large_image";
      active_image.style.backgroundImage = `url(${label_image.image_file_l})`;

      setPanZoom(active_image);

      if (label.is_group && label_image.caption) {
        const caption = document.createElement("div");
        active_image_and_caption.appendChild(caption);
        caption.className = "modal_caption";
        caption.innerHTML = `${label_image.caption}`;
      }
    }
  }

  if (should_show_image_list) {
    // Add left/right arrows for more than 1 image
    const left_arrow_container = document.createElement("div");
    active_image_cont.appendChild(left_arrow_container);
    left_arrow_container.className = "arrow_container left";
    const left_arrow = document.createElement("div");
    left_arrow_container.appendChild(left_arrow);
    left_arrow.className = "arrow_left";
    left_arrow_container.addEventListener("click", function () {
      const image_modals = this.parentNode.getElementsByClassName(
        "modal_active_image_and_caption"
      );
      for (let index = 0; index < image_modals.length; index++) {
        const element = image_modals[index];
        if (element.style.opacity === "1") {
          element.style.opacity = "0";
          element.style.visibility = "hidden";
          setPanZoom(element.firstChild);
          let previousElementIndex = 0;
          if (index === 0) {
            previousElementIndex = image_modals.length - 1;
          } else {
            previousElementIndex = index - 1;
          }
          current_active_image = image_modals[previousElementIndex];
          current_active_image.style.opacity = "1";
          current_active_image.style.visibility = "visible";
          break;
        }
      }
    });

    const right_arrow_container = document.createElement("div");
    active_image_cont.appendChild(right_arrow_container);
    right_arrow_container.className = "arrow_container right";
    const right_arrow = document.createElement("div");
    right_arrow_container.appendChild(right_arrow);
    right_arrow.className = "arrow_right";
    right_arrow_container.addEventListener("click", function () {
      const image_modals = this.parentNode.getElementsByClassName(
        "modal_active_image_and_caption"
      );
      for (let index = 0; index < image_modals.length; index++) {
        const element = image_modals[index];
        if (element.style.opacity === "1") {
          element.style.opacity = "0";
          element.style.visibility = "hidden";
          setPanZoom(element.firstChild);
          let nextElementIndex = 0;
          if (index === image_modals.length - 1) {
            nextElementIndex = 0;
          } else {
            nextElementIndex = index + 1;
          }
          current_active_image = image_modals[nextElementIndex];
          current_active_image.style.opacity = "1";
          current_active_image.style.visibility = "visible";
          break;
        }
      }
    });
  }
}

const paths_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
paths_svg.classList.add("paths_svg");
paths_svg.setAttribute(
  "viewBox",
  `0 0 ${window.data.background_dimensions[0]} ${window.data.background_dimensions[1]}`
);

function handle_path_mousedown(event) {
  event.target.classList.add("active");
}

function handle_path_touchmove(event) {
  const { top, right, bottom, left } = event.target.getBoundingClientRect();
  const { clientX, clientY } = event.touches[0];
  if (
    !(clientX > left && clientX < right && clientY > top && clientY < bottom)
  ) {
    event.target.classList.remove("active");
  }
}

window.addEventListener(
  "touchmove",
  function handle_touchmove(event) {
    if (event.touches.length !== 1) {
      event.preventDefault();
      return false;
    }
    return true;
  },
  { passive: false }
);

for (let i = 0; i < window.data.playlist_labels.length; i++) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  if (!window.data.playlist_labels[i].region_svg) {
    const error = document.createElement("div");
    error.className = "error";
    error.innerHTML = `Missing region_svg for label ${i}`;
    document.body.innerHTML = "";
    document.body.appendChild(error);
    break;
  }
  path.setAttribute("d", window.data.playlist_labels[i].region_svg);
  path.setAttribute("class", "path");
  paths_svg.appendChild(path);
  background.appendChild(paths_svg);

  path.addEventListener("touchstart", handle_path_mousedown);
  path.addEventListener("mousedown", handle_path_mousedown);
  path.addEventListener("touchmove", handle_path_touchmove);

  path.addEventListener("click", function path_click() {
    active_path = path;
    [current_active_image] = active_images[i];
    if (current_active_image) {
      current_active_image.style.opacity = 1;
      current_active_image.style.visibility = "visible";
    }
    current_modal = modals[i];
    left_cols[i].scrollTop = 0;
    current_modal.style.opacity = 1;
    current_modal.style.pointerEvents = "all";
    modal_cont.style.opacity = 1;
    modal_cont.style.pointerEvents = "all";
    active_collect_element = collect_elements[i];
    save_label(labels[i].id);
  });
}

const tap_error_el = document.createElement("div");
document.body.appendChild(tap_error_el);
tap_error_el.className = "tap_error";

const tap_error_text_el = document.createElement("div");
tap_error_el.appendChild(tap_error_text_el);
tap_error_text_el.innerText = "Select an object to collect";
tap_error_text_el.className = "tap_error_text";

const tap_error_close_el = document.createElement("div");
tap_error_el.appendChild(tap_error_close_el);
tap_error_close_el.className = "tap_error_close";

let close_tap_error_timeout = null;

function close_tap_error() {
  window.clearTimeout(close_tap_error_timeout);
  window.removeEventListener("click", close_tap_error);
  tap_error_el.style.opacity = 0;
  tap_error_el.style.pointerEvents = "none";
  modal_cont.style.opacity = 0;
  modal_cont.style.pointerEvents = "none";
}

function open_modal(errorText) {
  tap_error_text_el.innerHTML = errorText;
  tap_error_el.style.opacity = 1;
  tap_error_el.style.pointerEvents = "all";
  modal_cont.style.opacity = 1;
  modal_cont.style.pointerEvents = "all";
  window.clearTimeout(close_tap_error_timeout);
  close_tap_error_timeout = window.setTimeout(close_tap_error, 8000);
  window.addEventListener("click", close_tap_error);
}

const tap_source = new EventSource("/api/tap-source");

tap_source.onmessage = function (event) {
  close_notification_bar();
  window.clearTimeout(close_notification_bar_timer);
  close_notification_bar_timer = window.setTimeout(
    handle_notification_bar_timer_timeout,
    NOTIFICATION_BAR_TIMEOUT
  );
  const event_data = JSON.parse(event.data);
  const tap_successful =
    event_data.tap_successful && event_data.tap_successful === 1;

  if (!active_collect_element && tap_successful) {
    open_modal(
      `<h1>${NOTIFICATION_TEXT}</h1><p>Take it home by tapping your <br>Lens on the reader.</p>`
    );
    return;
  }

  if (!tap_successful) {
    open_modal(
      "<h1>Work not collected</h1><p>See a Visitor Experience staff member</p>"
    );
    return;
  }

  if (is_animating_collect) return;

  const element = active_collect_element;
  is_animating_collect = true;
  element.className = "modal_collect hidden";
  window.setTimeout(function () {
    element.innerHTML = "COLLECTED";
    element.className = "modal_collect active";
  }, 500);
  window.setTimeout(function () {
    element.className = "modal_collect active hidden";
  }, 3000);
  window.setTimeout(function () {
    element.className = "modal_collect";
    element.innerHTML = COLLECT_TEXT;
    is_animating_collect = false;
  }, 3500);
  // Set the modal timeout to 5 seconds after a lens tap
  // 5 + 3.5 seconds to reset the collect text
  setModalTimeout(8500);
};
