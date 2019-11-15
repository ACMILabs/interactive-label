const MAX_IMAGE_HEIGHT = 450
const MAX_IMAGE_WIDTH = 800

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

const modals = []
let current_modal = null
let current_lightbox = null

const lightboxes = new Array(labels.length)
for (let i=0; i<lightboxes.length; i++) {
  lightboxes[i] = {
    element: null,
    image_list: null,
    images: new Array(labels[i].works.length),
    image_centers: new Array(labels[i].works.length),
    num_images_loaded: 0,
    current_image: null,
  }
}


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
modal_blind.addEventListener('click', function close_modal () {
  current_modal.style.opacity = 0
  current_modal.style.pointerEvents = 'none'
  modal_cont.style.opacity = 0
  modal_cont.style.pointerEvents = 'none'
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

function create_image_load_handler (image, lightbox_index, image_index) {
  // This is a closure for image onload
  return function () {
    let new_width
    let new_height
    if (image.naturalWidth / image.naturalHeight > (MAX_IMAGE_WIDTH / MAX_IMAGE_HEIGHT)) {
      new_width = MAX_IMAGE_WIDTH
      new_height = image.naturalHeight / image.naturalWidth * MAX_IMAGE_WIDTH
    } else {
      new_width = image.naturalWidth / image.naturalHeight * MAX_IMAGE_HEIGHT
      new_height = MAX_IMAGE_HEIGHT
    }
    image.style.width = new_width + 'px'
    image.style.height = new_height + 'px'

    lightboxes[lightbox_index].num_images_loaded += 1

    const num_works = labels[lightbox_index].works.length
    if (lightboxes[lightbox_index].num_images_loaded == num_works) {
      const images = lightboxes[lightbox_index].images
      for (let i=0; i<images.length; i++) {
        lightboxes[lightbox_index].image_centers[i] = images[i].offsetLeft + images[i].clientWidth / 2
      }
      set_lightbox_target(lightboxes[lightbox_index], 0)
    }
  }
}


for (let i=0; i<labels.length; i++) {
  const label = labels[i]

  const lightbox_cont = document.createElement('div')
  lightbox_cont.className = 'lightbox_cont'
  root.appendChild(lightbox_cont)
  lightboxes[i].element = lightbox_cont

  const lightbox_blind = document.createElement('div')
  lightbox_blind.className = 'lightbox_blind'
  lightbox_cont.appendChild(lightbox_blind)
  lightbox_blind.addEventListener('click', close_lightbox)

  const lightbox = document.createElement('div')
  lightbox.className = 'lightbox'
  lightbox_cont.appendChild(lightbox)

  const image_list_cont = document.createElement('div')
  lightbox.appendChild(image_list_cont)
  image_list_cont.className = 'lightbox_image_list_cont'

  const image_list = document.createElement('div')
  image_list_cont.appendChild(image_list)
  image_list.className = 'lightbox_image_list'
  lightboxes[i].image_list = image_list

  const close = document.createElement('div')
  lightbox.appendChild(close)
  close.className = 'lightbox_close'
  close.addEventListener('click', close_lightbox)


  for (let j=0; j<label.works.length; j++) {
    var image = new Image();
    lightboxes[i].images[j] = image
    image.className = 'lightbox_image'
    image_list.appendChild(image)
    image.onload = create_image_load_handler(image, i, j)
    image.src = label.works[j].image
    image.addEventListener('click', function () { set_lightbox_target(lightboxes[i], j) })
  }
}

function open_lightbox () {
  current_lightbox.element.style.opacity = 1
  current_lightbox.element.style.pointerEvents = 'all'
}

function close_lightbox () {
  current_lightbox.element.style.opacity = 0
  current_lightbox.element.style.pointerEvents = 'none'
}

function set_lightbox_target (lightbox, index) {
  if (lightbox.current_image) {
    lightbox.current_image.style.opacity = ''
  }
  lightbox.image_list.style.transform = 'translateX('+(-lightbox.image_centers[index])+'px)'
  lightbox.current_image = lightbox.images[index]
  lightbox.current_image.style.opacity = 1
}
