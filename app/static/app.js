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
      label_id
    })
  }).then(response => response.json());
}

// CONTENT

const labels = window.data.playlist_labels.map(function playlist_labels_map(x) {
  return {
    id: x.label.id,
    title: x.label.title,
    publication: x.label.publication,
    description: x.label.description,
    video_url: x.resource,
    works: x.label.works,
    subtitles: `data:text/vtt;base64,${btoa(x.subtitles)}`
  };
});

// STATE

const modals = [];
let active_collect_element = null;
const collect_elements = [];
let current_modal = null;

const active_images = [];
for (let i = 0; i < labels.length; i++) {
  active_images[i] = new Array(labels[i].works.length);
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
  fetch(window.data.background, {mode: 'no-cors'})
    .then(function make_background() {
      background.style.backgroundImage = `url(${window.data.background})`;
    })
    .catch(no_background);
}

function close_modal() {
  current_modal.style.opacity = 0;
  current_modal.style.pointerEvents = "none";
  modal_cont.style.opacity = 0;
  modal_cont.style.pointerEvents = "none";
  active_collect_element = null
  save_label(null);
}

const modal_cont = document.createElement("div");
modal_cont.className = "modal_cont";
root.appendChild(modal_cont);

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

  const item = document.createElement("div");
  modals[i].appendChild(item);
  item.className = "modal_item";

  const left_col = document.createElement("div");
  item.appendChild(left_col);
  left_col.className = "modal_left_col";

  const title = document.createElement("div");
  left_col.appendChild(title);
  title.className = "modal_title";
  title.innerHTML = label.title;

  const publication = document.createElement("div");
  left_col.appendChild(publication);
  publication.className = "modal_publication";
  publication.innerHTML = label.publication;

  const description = document.createElement("div");
  left_col.appendChild(description);
  description.className = "modal_description";
  description.innerHTML = label.description;

  const active_image_cont = document.createElement("div");
  item.appendChild(active_image_cont);
  active_image_cont.className = "modal_active_image_cont";

  const image_list = document.createElement("div");
  item.appendChild(image_list);
  image_list.className = "modal_image_list";

  const back_button = document.createElement("div");
  item.appendChild(back_button);
  back_button.className = "modal_back_button";
  back_button.innerHTML = "BACK"
  back_button.addEventListener('click', close_modal)

  const collect = document.createElement("div");
  item.appendChild(collect);
  collect.className = "modal_collect";
  collect.innerHTML = "COLLECT";
  collect_elements.push(collect);

  for (let j = 0; j < label.works.length; j++) {
    const work = label.works[j];

    const active_image_and_caption = document.createElement("div");
    active_image_cont.appendChild(active_image_and_caption);
    active_image_and_caption.className = "modal_active_image_and_caption";

    active_images[i][j] = active_image_and_caption;

    const active_image = document.createElement("div");
    active_image_and_caption.appendChild(active_image);
    active_image.className = "modal_active_image";
    active_image.style.backgroundImage = `url(${work.image})`;

    const caption = document.createElement("div");
    active_image_and_caption.appendChild(caption);
    caption.className = "modal_caption";
    caption.innerHTML = `${work.title}, 1908<br/>Sir John Tenniel<br/>The Pierpont Morgan Library, New York. (edited)`;

    const image = document.createElement("div");
    image_list.appendChild(image);
    image.className = "modal_image";
    image.style.backgroundImage = `url(${work.image})`;
    image.addEventListener("click", function image_click() {
      current_active_image.style.opacity = 0;
      current_active_image = active_image_and_caption;
      current_active_image.style.opacity = 1;
    });
  }
}

const paths_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
paths_svg.className = "paths_svg";
paths_svg.setAttribute(
  "viewBox",
  `0 0 ${window.data.background_dimensions[0]} ${window.data.background_dimensions[1]}`
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

  path.addEventListener("click", function path_click() {
    [current_active_image] = active_images[i];
    current_active_image.style.opacity = 1;
    current_modal = modals[i];
    current_modal.style.opacity = 1;
    current_modal.style.pointerEvents = "all";
    modal_cont.style.opacity = 1;
    modal_cont.style.pointerEvents = "all";
    active_collect_element = collect_elements[i]
    save_label(labels[i].id);
  });
}

const tap_source = new EventSource("/api/tap-source");
tap_source.onmessage = function(e) {
  if (active_collect_element) {
    active_collect_element.className = 'modal_collect hidden'
    window.setTimeout(function () {
      active_collect_element.innerHTML = 'COLLECTED'
      active_collect_element.className = 'modal_collect active'
    }, 1000)
    window.setTimeout(function () {
      active_collect_element.className = 'modal_collect active hidden'
    }, 3000)
    window.setTimeout(function () {
      active_collect_element.className = 'modal_collect'
      active_collect_element.innerHTML = 'COLLECT'
    }, 4000)
  }
}
