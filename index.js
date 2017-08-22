// Creates a new canvas element with ability to change color, history, and erase
const Canvas = function(width, height) {
  // create the canvas DOM element
  this.node = document.createElement('canvas')
  this.node.width = width || window.innerWidth
  this.node.height = height || window.innerHeight

  // set other variables related to drawing on the canvas
  this.context = this.node.getContext('2d')
  this.isDrawing = false
  this.x = 0
  this.y = 0

  // history to be used for undoing changes
  this.currentState = undefined
  this.history = []
  this.updateState = state => {
    this.history.push(this.currentState)
    this.currentState = state
  }

}

// parent div for all color options,
// param: colors, list of html Color divs
const Colors = function(colors) {
  this.node = document.createElement('div')
  this.node.classList.add('colors')

  colors.forEach( color => this.node.appendChild(color))
}

// Color div that will be clicked to change color. I define the click after
// initialisation because I need the ctx of the canvas to change the strokeStyle
const Color = function(color) {
  this.node = document.createElement('div')
  this.node.classList.add('color')
  this.node.style.backgroundColor = color
}

const init = function(container) {
  // init canvas element and its events
  let canvas = new Canvas()
  let ctx = canvas.context

  ctx.strokeStyle = '#000'
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = 2

  // mouse events
  canvas.node.onmousemove = event => {
    // mouse is not clicked down
    if (!canvas.isDrawing) return

    ctx.beginPath()
    ctx.moveTo(canvas.x, canvas.y)
    ctx.lineTo(event.offsetX, event.offsetY)
    ctx.stroke()

    // update the starting positions for drawing the next event
    canvas.x = event.offsetX
    canvas.y = event.offsetY
  }

  canvas.node.onmousedown = event => {
    canvas.isDrawing = true
    canvas.x = event.offsetX
    canvas.y = event.offsetY
  }

  canvas.node.onmouseup = event => {
    canvas.isDrawing = false
    // store this value for undoing changes
    canvas.updateState(ctx.getImageData(0,0,canvas.node.width, canvas.node.height))
  }
  canvas.node.onmouseout = event => {
    // store this value for undoing changes
    if (canvas.isDrawing) {
      canvas.updateState(ctx.getImageData(0,0,canvas.node.width, canvas.node.height))
      canvas.isDrawing = false
    }


  }

  // create colors div and color change events
  const colors = [
    '#000',
    '#f44336',
    '#9C27B0',
    '#E91E63',
    '#3F51B5',
    '#009688',
    '#FF9800',
    '#FF5722',
  ].map(color => {
    // create the color node for each color in the list, then add the onclick
    // event handler. I did it this way because I could not think of a better
    // way to update the stroke color. Here I can use ctx in scope.
    let colorNode = new Color(color).node
    colorNode.onclick = event => {
      let colorNodes = document.querySelectorAll('.color')
      colorNodes.forEach( node => {
        if (event.target === node ) {
          node.innerHTML = '&#9998;'
        } else if (node.id !== 'undo'){
          node.innerHTML = ''
        }
      })
      let backgroundColor = event.target.style.backgroundColor
      ctx.strokeStyle = backgroundColor
    }
    return colorNode
  })



  // create the undo div, and its mouse event
  const undo = document.createElement('div')
  undo.classList.add('color')
  undo.id = 'undo'
  undo.innerHTML = '&cularr;'
  undo.style.color = '#000'
  undo.onclick = event => {
    // get the last event stored in the canvas history
    let previousState = canvas.history.pop()

    // restore that image to the canvas if it exists, otherwise, just clear the
    // canvas.
    if (previousState) {
      ctx.putImageData(previousState, 0, 0)
      canvas.currentState = previousState
    } else {
      ctx.clearRect(0,0,canvas.node.width, canvas.node.height)
      canvas.currentState = previousState
    }


  }
  // add the unshift button to the top of the colors list
  colors.unshift(undo)

  // create the colors div with all the color buttons added
  const colorsDiv = new Colors(colors)

  // append the canvas and colors to the DOM
  container.appendChild(canvas.node)
  container.appendChild(colorsDiv.node)

}

const container = document.getElementById('canvas')
init(container)
