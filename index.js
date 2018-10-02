function ReplaceWithPolyfill() {
  "use-strict" // For safari, and IE > 10
  var parent = this.parentNode,
    i = arguments.length,
    currentNode
  if (!parent) return
  if (!i)
    // if there are no arguments
    parent.removeChild(this)
  while (i--) {
    // i-- decrements i and returns the value of i before the decrement
    currentNode = arguments[i]
    if (typeof currentNode !== "object") {
      currentNode = this.ownerDocument.createTextNode(currentNode)
    } else if (currentNode.parentNode) {
      currentNode.parentNode.removeChild(currentNode)
    }
    // the value of "i" below is after the decrement
    if (!i)
      // if currentNode is the first argument (currentNode === arguments[0])
      parent.replaceChild(currentNode, this)
    // if currentNode isn't the first
    else parent.insertBefore(this.previousSibling, currentNode)
  }
}
if (!Element.prototype.replaceWith)
  Element.prototype.replaceWith = ReplaceWithPolyfill
if (!CharacterData.prototype.replaceWith)
  CharacterData.prototype.replaceWith = ReplaceWithPolyfill
if (!DocumentType.prototype.replaceWith)
  DocumentType.prototype.replaceWith = ReplaceWithPolyfill

// svg namespace needed for document.createElementNS
const ns = "http://www.w3.org/2000/svg"

// Creates a new svg element with ability to change color, history, and erase
const Canvas = function(width, height) {
  // create the svg DOM element
  this.node = document.createElementNS(ns, "svg")
  this.node.setAttribute("width", width || window.innerWidth)
  this.node.setAttribute("height", height || window.innerHeight)

  // set other variables related to drawing on the canvas
  this.drawingOrErasing = "drawing"
  this.isDrawing = false
  this.x = 0
  this.y = 0

  // mouse events
  const onMouseMove = e => {
    // mouse is not clicked down
    if (!this.isDrawing) return

    if (this.drawingOrErasing === "drawing") {
      const path = `M ${this.x} ${this.y} L ${e.offsetX} ${e.offsetY}`
      this.createPath(path)

      // update the starting positions for drawing the next event
      this.x = e.offsetX
      this.y = e.offsetY
    }

    if (this.drawingOrErasing === "erasing") {
      const rect = document.querySelector("rect")
      const [x1, x2] = [this.x, e.offsetX].sort((a, b) => (a > b ? 1 : -1))
      const [y1, y2] = [this.y, e.offsetY].sort((a, b) => (a > b ? 1 : -1))
      const dx = x2 - x1
      const dy = y2 - y1
      if (!rect) {
        const newRect = document.createElementNS(ns, "rect")
        newRect.setAttribute("x", x1)
        newRect.setAttribute("y", y1)
        newRect.setAttribute("width", dx)
        newRect.setAttribute("height", dy)
        newRect.setAttribute("fill", "#ffa50040")
        this.node.appendChild(newRect)
      } else {
        rect.setAttribute("x", x1)
        rect.setAttribute("y", y1)
        rect.setAttribute("width", dx)
        rect.setAttribute("height", dy)
        rect.setAttribute("fill", "#ffa50040")
      }
    }
  }

  const onMouseDown = e => {
    this.isDrawing = true

    this.x = e.offsetX
    this.y = e.offsetY
  }

  const onMouseUp = e => {
    this.isDrawing = false

    if (this.drawingOrErasing === "drawing") {
      // store this value for undoing changes
      const currentState = document.querySelectorAll(".svg-path")
      this.updateState(currentState)
    }
    if (this.drawingOrErasing === "erasing") {
      //** remove all paths that intersect with the rectangle **//
      // First, sort points to insure that width and height are always
      // a positive value
      const [x1, x2] = [this.x, e.offsetX].sort((a, b) => (a > b ? 1 : -1))
      const [y1, y2] = [this.y, e.offsetY].sort((a, b) => (a > b ? 1 : -1))

      const rect = this.node.createSVGRect()
      rect.x = x1
      rect.y = y1
      rect.width = x2 - x1
      rect.height = y2 - y1
      const chosenPaths = Array.from(this.node.getIntersectionList(rect, null))
      chosenPaths.forEach(path => path.remove())

      const currentState = document.querySelectorAll(".svg-path")
      this.updateState(currentState)
    }
  }

  const onMouseLeave = e => {
    // store this value for undoing changes
    if (this.isDrawing && this.drawingOrErasing === 'drawing') {
      const currentState = document.querySelectorAll(".svg-path")
      this.updateState(currentState)
      this.isDrawing = false
    }
  }

  this.setMouseEvents = () => {
    this.node.onmousedown = onMouseDown
    this.node.onmouseup = onMouseUp
    this.node.onmousemove = onMouseMove
    this.node.onmouseleave = onMouseLeave
  }

  // history to be used for undoing changes
  this.currentState = undefined
  this.history = []
  this.updateState = state => {
    this.history.push(this.currentState)
    this.currentState = state
  }

  // Method to reset element to a previous state, usually the last state in history
  this.refreshNode = state => {
    while (this.node.firstChild) {
      this.node.firstChild.remove()
    }
    if (state !== undefined) {
      state.forEach(path => this.node.appendChild(path))
    }
  }

  // Method to create a path element
  this.strokeStyle = "#000"
  this.setStroke = stroke => {
    this.strokeStyle = stroke
  }

  this.createPath = path => {
    const pathNode = document.createElementNS(ns, "path")
    pathNode.setAttribute("d", path)
    pathNode.setAttribute("stroke", this.strokeStyle)
    pathNode.setAttribute("stroke-linecap", "round")
    pathNode.setAttribute("stroke-width", "2")
    pathNode.classList.add("svg-path")

    this.node.appendChild(pathNode)
  }
}

// parent div for all color options,
// param: colors, list of html Color divs
const Colors = function(colors) {
  this.node = document.createElement("div")
  this.node.classList.add("colors")

  colors.forEach(color => this.node.appendChild(color))
}

// Color div that will be clicked to change color. I define the click after
// initialisation because I need the ctx of the canvas to change the strokeStyle
const Color = function(color) {
  this.node = document.createElement("div")
  this.node.classList.add("color")
  this.node.style.backgroundColor = color
}

const init = function(container) {
  // init canvas element and its events
  let canvas = new Canvas()

  // mouse events
  canvas.setMouseEvents()

  // create colors div and color change events
  const colors = [
    "#000",
    "#f44336",
    "#9C27B0",
    "#E91E63",
    "#3F51B5",
    "#009688",
    "#FF9800",
    "#FF5722",
  ].map(color => {
    // create the color node for each color in the list, then add the onclick
    // event handler. I did it this way because I could not think of a better
    // way to update the stroke color. Here I can use svg dom element in scope.
    let colorNode = new Color(color).node
    colorNode.onclick = event => {
      let colorNodes = document.querySelectorAll(".color")
      colorNodes.forEach(node => {
        if (event.target === node) {
          node.innerHTML = "✎"
        } else if (node.id !== "undo" && node.id !== "erase") {
          node.innerHTML = ""
        }
        if (node.id === 'erase') {
          node.classList.remove('eraser-active')
        }
      })
      let backgroundColor = event.target.style.backgroundColor
      canvas.drawingOrErasing = "drawing"
      canvas.setStroke(backgroundColor)
    }
    return colorNode
  })

  // create the erase div, and its mouse event
  const erase = document.createElementNS(ns, "svg")
  erase.id = "erase"
  erase.setAttribute("role", "img")
  erase.setAttribute("width", "24")
  erase.setAttribute("height", "24")
  erase.setAttribute("viewBox", "0 0 24 24")

  const path = document.createElementNS(ns, "path")
  path.setAttribute("fill", "#626569")
  path.setAttribute(
    "d",
    `M12.586 1.586a2 2 0 0 1 2.828 0l7 7a2 2 0 0 1 0 2.828l-9 9
        A2 2 0 0 1 12 21H8a2 2 0 0 1-1.414-.586l-5-5a2 2 0 0 1 0-2.828l11-11z
        M3 14l5 5h4l9-9-7-7L3 14zm4-4l7-7 7 7-7 7-7-7z`
  )

  erase.appendChild(path)
  erase.onclick = e => {
    canvas.drawingOrErasing = "erasing"
    const eraser = document.getElementById('erase')
    eraser.classList.add('eraser-active')
  }
  erase.classList.add("color")
  colors.unshift(erase)

  // create the undo div, and its mouse event
  const undo = document.createElement("div")
  undo.classList.add("color")
  undo.id = "undo"
  undo.innerHTML = "&cularr;"
  undo.style.color = "#000"
  undo.onclick = event => {
    // get the last event stored in the canvas history
    let previousState = canvas.history.pop()
    // restore that image to the canvas
    canvas.refreshNode(previousState)
    canvas.currentState = previousState
  }
  // add the unshift button to the top of the colors list
  colors.unshift(undo)

  // create the colors div with all the color buttons added
  const colorsDiv = new Colors(colors)

  // append the canvas and colors to the DOM
  container.appendChild(canvas.node)
  container.appendChild(colorsDiv.node)
}

const container = document.getElementById("canvas")
init(container)
