const MAX_IMAGE_HEIGHT = 450
const MAX_IMAGE_WIDTH = 800


function save_label(label_id) {
  // Save label selected to the local database for a tap
  fetch('http://localhost:8081/api/labels/', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify({
      datetime: Date.now(),
      label_id: label_id,
    }),
  })
    .then(response => response.json())
    .then(data => console.log(JSON.stringify(data)))
    .catch(error => console.error(error))
}


// CONTENT

// @Incomplete Create a paths model that links them to labels. The paths are
// currently hardcoded so this ensures they all open a label
const labels = paths.map(function (_, i) {
  const x = window._labels[i%window._labels.length]
  return {
    id: x.label.id,
    title: x.label.title,
    publication: x.label.publication,
    description: x.label.description,
    video_url: x.resource,
    works: x.label.works,
    subtitles: 'data:text/vtt;base64,'+btoa(x.subtitles),
  }
})


// STATE

const modals = []
let current_modal = null

const active_images = []
for (let i=0; i<labels.length; i++) {
  active_images[i] = new Array(labels[i].works.length)
}
let current_active_image = null

// DOM

const root = document.getElementById('root')

const background = document.createElement('div')
root.appendChild(background)
background.className = 'background'
background.style.backgroundImage = 'url(/static/bg.jpg)'

const paths_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
paths_svg.className = 'paths_svg'
paths_svg.setAttribute("viewBox", '0 0 2386 1226')

for (let i=0; i<paths.length; i++) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', paths[i])
  path.setAttribute('class', 'path')
  paths_svg.appendChild(path)
  background.appendChild(paths_svg)

  path.addEventListener('click', function () {
    current_active_image = active_images[i][0]
    current_active_image.style.opacity = 1
    current_modal = modals[i]
    current_modal.style.opacity = 1
    current_modal.style.pointerEvents = 'all'
    modal_cont.style.opacity = 1
    modal_cont.style.pointerEvents = 'all'
    save_label(labels[i].id)
  })
}

const modal_cont = document.createElement('div')
modal_cont.className = 'modal_cont'
root.appendChild(modal_cont)

const modal_blind = document.createElement('div')
modal_blind.className = 'modal_blind'
modal_cont.appendChild(modal_blind)
modal_blind.addEventListener('click', function close_modal () {
  current_modal.style.opacity = 0
  current_modal.style.pointerEvents = 'none'
  modal_cont.style.opacity = 0
  modal_cont.style.pointerEvents = 'none'
  save_label(null)
})

for (let i=0; i<labels.length; i++) {
  const modal = document.createElement('div')
  modal.className = 'modal'
  modal_cont.appendChild(modal)
  modals[i] = modal
}


for (let i=0; i<labels.length; i++) {
  const label = labels[i]

  const item = document.createElement('div')
  modals[i].appendChild(item)
  item.className = 'modal_item'

  const left_col = document.createElement('div')
  item.appendChild(left_col)
  left_col.className = 'modal_left_col'

  const title = document.createElement('div')
  left_col.appendChild(title)
  title.className = 'modal_title'
  title.innerHTML = label.title

  const publication = document.createElement('div')
  left_col.appendChild(publication)
  publication.className = 'modal_publication'
  publication.innerHTML = label.publication

  const description = document.createElement('div')
  left_col.appendChild(description)
  description.className = 'modal_description'
  description.innerHTML = label.description

  const active_image_cont = document.createElement('div')
  item.appendChild(active_image_cont)
  active_image_cont.className = 'modal_active_image_cont'

  const image_list = document.createElement('div')
  item.appendChild(image_list)
  image_list.className = 'modal_image_list'


  for (let j=0; j<label.works.length; j++) {
    const work = label.works[j]

    const active_image_and_caption = document.createElement('div')
    active_image_cont.appendChild(active_image_and_caption)
    active_image_and_caption.className = 'modal_active_image_and_caption'

    active_images[i][j] = active_image_and_caption

    const active_image = document.createElement('div')
    active_image_and_caption.appendChild(active_image)
    active_image.className = 'modal_active_image'
    active_image.style.backgroundImage = 'url('+work.image+')'

    const caption = document.createElement('div')
    active_image_and_caption.appendChild(caption)
    caption.className = 'modal_caption'
    caption.innerHTML = work.title+", 1908<br/>Sir John Tenniel<br/>The Pierpont Morgan Library, New York. (edited)"

    const image = document.createElement('div')
    image_list.appendChild(image)
    image.className = 'modal_image'
    image.style.backgroundImage = 'url('+work.image+')'
    image.addEventListener('click', function () {
      current_active_image.style.opacity = 0
      current_active_image = active_image_and_caption
      current_active_image.style.opacity = 1
    })
  }
}
