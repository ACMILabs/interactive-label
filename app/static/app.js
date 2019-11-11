const labels = paths.map(function (_, i) {
  const x = window._labels[i%window._labels.length]
  return {
    id: x.label.id,
    title: x.label.title,
    description: x.label.description,
    video_url: x.resource,
    image_url: x.image,
    subtitles: 'data:text/vtt;base64,'+btoa(x.subtitles),
  }
})



const root = document.getElementById('root')

const background = document.createElement('div')
root.appendChild(background)
background.className = 'background'
background.style.backgroundImage = 'url(/static/bg.jpg)'

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svg.className = 'svg'
svg.setAttribute("viewBox", '0 0 2386 1226')

let current_modal = null

for (let i=0; i<paths.length; i++) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', paths[i])
  path.setAttribute('class', 'path')
  svg.appendChild(path)
  background.appendChild(svg)

  path.addEventListener('click', function () {
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

modal_blind.addEventListener('click', function () {
    current_modal.style.opacity = 0
    current_modal.style.pointerEvents = 'none'
    modal_cont.style.opacity = 0
    modal_cont.style.pointerEvents = 'none'
})

const modals = []
for (let i=0; i<labels.length; i++) {
  const modal = document.createElement('div')
  modal.className = 'modal'
  modal_cont.appendChild(modal)
  modals[i] = modal
}


for (let i=0; i<labels.length; i++) {
  const item_data = labels[i]

  const item = document.createElement('div')
  modals[i].appendChild(item)
  item.className = 'modal_item'

  const image = document.createElement('div')
  item.appendChild(image)
  image.className = 'modal_image'
  image.style.backgroundImage = 'url('+item_data.image_url+')'

  const title = document.createElement('div')
  item.appendChild(title)
  title.className = 'modal_title'
  title.innerHTML = item_data.title

  const description = document.createElement('div')
  item.appendChild(description)
  description.className = 'modal_description'
  description.innerHTML = item_data.description
}
