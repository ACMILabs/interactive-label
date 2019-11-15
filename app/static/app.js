// CONTENT

const labels = paths.map(function (_, i) {
  const x = window._labels[i%window._labels.length]
  return {
    id: x.label.id,
    title: x.label.title,
    publication: x.label.publication,
    description: x.label.description,
    video_url: x.resource,
    works: [...x.label.works, ...x.label.works],
    subtitles: 'data:text/vtt;base64,'+btoa(x.subtitles),
  }
})



// STATE

let current_modal = null
const modals = []
let current_lightbox = null
const lightboxes = []



// DOM

const root = document.getElementById('root')

const background = document.createElement('div')
root.appendChild(background)
background.className = 'background'
background.style.backgroundImage = 'url(/static/bg.jpg)'

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.className = 'svg'
svg.setAttribute("viewBox", '0 0 2386 1226')

for (let i=0; i<paths.length; i++) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', paths[i])
  path.setAttribute('class', 'path')
  svg.appendChild(path)
  background.appendChild(svg)

  path.addEventListener('click', function () {
    current_lightbox = lightboxes[i]
    current_modal = modals[i]
    current_modal.style.opacity = 1
    current_modal.style.pointerEvents = 'all'
    modal_cont.style.opacity = 1
    modal_cont.style.pointerEvents = 'all'
  })
}

const modal_cont = document.createElement('div')
modal_cont.className = 'modal_cont'
root.appendChild(modal_cont)

const modal_blind = document.createElement('div')
modal_blind.className = 'modal_blind'
modal_cont.appendChild(modal_blind)

function close_modal () {
    current_modal.style.opacity = 0
    current_modal.style.pointerEvents = 'none'
    modal_cont.style.opacity = 0
    modal_cont.style.pointerEvents = 'none'
}
modal_blind.addEventListener('click', close_modal)

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

  const image_list = document.createElement('div')
  item.appendChild(image_list)
  image_list.className = 'modal_image_list'

  for (let i=0; i<label.works.length; i++) {
    const image = document.createElement('div')
    image_list.appendChild(image)
    image.className = 'modal_image'
    image.style.backgroundImage = 'url('+label.works[i].image+')'
    image.addEventListener('click', open_lightbox)
  }
}

for (let i=0; i<labels.length; i++) {
  const label = labels[i]

  const lightbox_cont = document.createElement('div')
  lightbox_cont.className = 'lightbox_cont'
  root.appendChild(lightbox_cont)
  lightboxes[i] = lightbox_cont

  const lightbox_blind = document.createElement('div')
  lightbox_blind.className = 'lightbox_blind'
  lightbox_cont.appendChild(lightbox_blind)
  lightbox_blind.addEventListener('click', close_lightbox )

  const lightbox = document.createElement('div')
  lightbox.className = 'lightbox'
  lightbox_cont.appendChild(lightbox)

  for (let i=0; i<label.works.length; i++) {
    const image = document.createElement('div')
    lightbox.appendChild(image)
    image.className = 'lightbox_image'
    image.style.backgroundImage = 'url('+label.works[i].image+')'
    image.addEventListener('click', function () { set_lightbox_target(i) })
  }
}

function open_lightbox () {
  current_lightbox.style.opacity = 1
  current_lightbox.style.pointerEvents = 'all'
}

function close_lightbox () {
  current_lightbox.style.opacity = 0
  current_lightbox.style.pointerEvents = 'none'
}
// INIT
