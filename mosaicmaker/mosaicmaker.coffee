# create imagedata from array of (array of colors)
colorsToCanvas = do ->
  ctx = document.createElement('canvas').getContext '2d'
  (ary) ->
    if arguments.length is 3
      [width, height, ary] = arguments
    else
      [width, height] = [ary.length, ary[0].length]
    ctx.canvas.width  = width
    ctx.canvas.height = height
    idata = ctx.createImageData(width, height)
    for inner, x in ary
      if 'length' not of inner
        inner = [inner]
      for color, y in inner
        idata.data.set([
          color.r, color.g, color.b, 255
        ], (x + y * width) << 2)
    ctx.putImageData(idata, 0, 0)
    ctx.canvas


class ImageProcessorOption extends Assoc
  init: (@proc) ->

  set: (name, value) ->
    @map[name] = value
    if name is 'mode'
      [@map.unitSize, @map.domainSize] = (
        switch value
          when 'stack-plate' then [[5, 2], [4, 6]]
          when 'stack-brick' then [[5, 6], [4, 4]]
          when 'lay'         then [[5, 5], [4, 4]]
      )
    if name is 'mode' or name is 'width'
      @map.height = @map.width * @map.unitSize[0] / @map.unitSize[1]
    @change()
    @proc?.render()

  get: (name) ->
    switch name
      when 'unitWidth' then @map.unitSize?[0]
      when 'unitHeight' then @map.unitSize?[1]
      when 'domainWidth' then @map.domainSize?[0]
      when 'domainHeight' then @map.domainSize?[1]
      else @map[name]


class ImageProcessor extends Model
  program: {}
  vshader: constants.mosaic.vshader
  fshader: constants.mosaic.fshader

  constructor: (@option, @palette) ->
    super
    @_gl = new MicroGL(antialias: false)
    for name in Object.keys @fshader
      @program[name] = @_gl.makeProgram(@vshader, @fshader[name])
    @colorReduced = document.createElement('canvas').getContext '2d'
    @_img = document.createElement 'img'

  _renderGL: (width, height, program, source, u_colors) ->
    vars = { u_colors }
    for name in @option.keys()
      vars['u_' + name] = @option.get name
    tex = @_gl.texture source
    @_gl
      .texParameter(tex, filter: 'NEAREST')
      .init(null, width, height)
      .program(program)
      .bindVars(
        a_position: [-1,-1, -1,1, 1,-1, 1,1]
        u_source: tex
      )
      .bindVars(vars)
      .draw().gl.canvas

  _reduceColor: ->
    colors = (c.color for c in @palette.colors when c.use)
    if @option.get 'dither'
      program = @program.reduceColorDithered
      colors =
      colorCanv = colorsToCanvas(128, 2,
        SuperArray::combinations.call(
          colors.sort((a, b) -> a.luma() - b.luma()), 2
        ).sort(
          ([a1, a2], [b1, b2]) -> a1.dist(a2) - b1.dist(b2)
        ).slice(0, 128)
      )
    else
      program = @program.reduceColor
      colorCanv = colorsToCanvas 32, 1, colors

    # draw on canvas: @colorReduced
    canv = @colorReduced.canvas
    canv.width  = @width  = @option.get('width')
    canv.height = @height =
      @option.get('height') * @_img.height / @_img.width |0
    @colorReduced.drawImage(
      @_renderGL(
        @width, @height,
        program, @_img,
        colorCanv
      )
    , 0, 0)

  _countAmount: ->
    data = @colorReduced.getImageData(0, 0, @width, @height).data
    amounts = {}
    for i in [0...data.length] by 4
      color = new Color data.subarray(i, i + 3)...
      amounts[color] or= 0
      amounts[color]++
    for c in @palette.colors
      c.amount = amounts[c.color]
    @palette.change()

  _renderProc: ->
    @_reduceColor()
    @_countAmount()
    @change()

  render: (source) ->
    if source
      @_img.onload = @_renderProc.bind @
      @_img.src = source
    else
      @_renderProc()

  getThumbnail: ->
    @_renderGL(
      @width  * @option.get 'unitWidth'
      @height * @option.get 'unitHeight'
      @program.noop, @colorReduced.canvas
    )

  getBlueprint: ->
    scale = @option.get 'scale'
    @_renderGL(
      @width  * @option.get('unitWidth')  * scale,
      @height * @option.get('unitHeight') * scale,
      @program.blueprint, @colorReduced.canvas,
      colorsToCanvas(32, 1, ([c.color] for c in @palette.colors when c.checked))
    )


# models and views
class Palette extends Model
  constructor: (@colors=[]) ->
    @_idx = {}
    for c, i in @colors
      @_idx[c.name] = i

  init: (@proc) ->

  color: (name) ->
    @colors[@_idx[name]]

#  add: (name, color, use=false, checked=false) ->
#    @_idx[name] = -1 + @color.push { name, color, use, checked }
#    @change()
#  remove: (name) ->
#    @color.splice(@_idx[name], 1)
#    delete @_idx[name]
#    @change()

  use: (name) ->
    @color(name).use = true
    @change()
    @proc.render()
  unuse: (name) ->
    color = @color(name)
    color.use = color.checked = false
    @change()
    @proc.render()

  check: (name) ->
    @color(name).checked = true
    @change()
  uncheck: (name) ->
    @color(name).checked = false
    @change()

  setAmount: (name, value) ->
    @color(name).amount = value
    @change()


class PaletteView extends View
  constructor: (model, @elem) ->
    super

    frag = document.createDocumentFragment()
    for c in model.colors
      li = document.createElement 'li'
      li.style.backgroundColor = c.color
      li.dataset.name = c.name
      frag.appendChild li
    @elem.appendChild frag

    @elem.addEventListener 'click', (e) ->
      name = e.target.dataset.name
      color = model.color(name)
      return unless color
      if color.checked
        model.unuse name
      else if color.use
        model.check name
      else
        model.use name
    , false

    @render()

  render: ->
    for li in @elem.childNodes
      color = @model.color(li.dataset.name)
      classes = []
      if color.use
        classes.push 'color-use'
      if color.checked
        if color.color.luma() < 128
          classes.push 'color-checked-dark'
        else
          classes.push 'color-checked-light'
      li.className = classes.join ' '


class PartsAmountView extends View
  constructor: (model, @elem) ->
    super
    @render()

  _createLi: ({ name, color, amount }) ->
    colorBox = document.createElement 'span'
    colorBox.className = 'color-box'
    colorBox.style.backgroundColor = color
    li = document.createElement 'li'
    li.appendChild colorBox
    li.appendChild document.createTextNode "(#{amount}x) #{name}"
    li

  render: ->
    @elem.innerHTML = ''
    frag = document.createDocumentFragment()
    for c in @model.colors when c.amount
      frag.appendChild @_createLi(c)
    @elem.appendChild frag


class RendererView extends View
  rendered: false
  constructor: (model, @elem) ->
    super
    @_ctx = @elem.getContext '2d'

  show: (file) ->
    if file
      return unless ~file.type.indexOf 'image'
      url = window.URL.createObjectURL file
    else
      return unless @rendered
    @rendered = true
    @model.render(url)

  render: ->
    return unless @rendered
    thumb = @model.getThumbnail()
    @elem.width = thumb.width
    @elem.height = thumb.height
    @_ctx.drawImage thumb, 0, 0

  showBlueprint: ->
    return unless @rendered
    a = document.createElement 'a'
    a.href = @model.getBlueprint().toDataURL('image/png')
    a.setAttribute 'download', 'image.png'
    a.click()


# main
cancelEvent = (e) ->
  e.stopPropagation()
  e.preventDefault()

main = ->
  palette = new Palette(constants.mosaic.colors)
  new PaletteView(palette, $ 'palette')
  new PartsAmountView(palette, $ 'amount')
  option = new ImageProcessorOption(constants.mosaic.option)
  new FormView(option, $ 'form')
  proc = new ImageProcessor(option, palette)
  view = new RendererView(proc, $ 'canv')

  palette.init(proc)
  option.init(proc)

  document.body.addEventListener 'dragenter', cancelEvent, false
  document.body.addEventListener 'dragover', cancelEvent, false
  document.body.addEventListener 'drop', (e) ->
    cancelEvent(e)
    view.show e.dataTransfer?.files?[0]
  , false
  $('render-button').addEventListener 'click', ->
    view.showBlueprint()
  , false
  $('optimizer-button').addEventListener 'click', ->
    pid = if ~option.get('mode').indexOf('brick') then 3005 else 3024
    url = '/optimizer?o=' + (
      for color in palette.colors when color.amount > 0
        "#{pid},#{color.id},#{color.amount}"
    ).join '|'
    window.open url
  , false

document.addEventListener 'DOMContentLoaded', main, false