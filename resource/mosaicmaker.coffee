# utilities
$ = (id) -> document.getElementById id

class SuperArray extends Array
  constructor: (ary=[]) -> Array::push.apply(@, ary)

  minBy: (func) ->
    min = Infinity
    solution = null
    for d in @
      res = func(d)
      [min, solution] = [res, d] if min > res
    solution

  maxBy: (func) -> @minBy (d) -> -func(d)
  min: -> Math.min @...
  max: -> Math.max @...

  combinations: (len) ->
    return [[]] unless len
    res = []
    for a, i in @
      for last in SuperArray::combinations.call @slice(i + 1), len - 1
        res.push [a].concat(last)
    res


uuid = do ->
  re = /[xy]/g
  replacer = (c) ->
    r = Math.random() * 16 |0
    (if c is 'x' then r else (r & 3 | 8)).toString 16
  ->
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(re, replacer).toUpperCase()

class Model
  constructor: ->
    @_uuid = uuid()
  change: ->
    eve "#{@_uuid}.change"

class View
  constructor: (@model) ->
    eve.on "#{@model._uuid}.change", @render.bind @
  render: ->


# classes
class Color
  constructor: (@r=0, @g=0, @b=0) ->

  dist: (color) ->
    [dr, dg, db] = [color.r - @r, color.g - @g, color.b - @b]
    Math.sqrt(dr * dr + dg * dg + db * db)

  luma: -> @r * 0.3 + @g * 0.59 + @b * 0.11
  toArray: -> [@r, @g, @b]
  toString: -> "rgb(#{@r}, #{@g}, #{@b})"

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
      for color, y in inner
        idata.data.set([
          color.r, color.g, color.b, 255
        ], (x + y * width) << 2)
    ctx.putImageData(idata, 0, 0)
    ctx.canvas


class ImageProcessor
  width: 48
  unitWidth: 5
  unitHeight: 2
  dither: false
  vivid: false
  brightness: 0
  contrast: 0
  colors: []

  colorReduced: null
  #program: {}

  shader:
    vertex: """
      attribute vec2 a_position;
      varying vec2 v_texCoord;

      void main(){
        v_texCoord = a_position / 2.0 + vec2(0.5);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    """
    noop: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_sourceSize;
      varying vec2 v_texCoord;

      void main(){
        gl_FragColor = texture2D(u_source, v_texCoord);
      }
    """
    
    reduceColorDithered: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform sampler2D u_colors;

      uniform bool u_vivid;
      uniform float u_brightness;
      uniform float u_contrast;

      varying vec2 v_texCoord;
    
      const int COMBINATIONS = 128;
      
      void getColors(in int idx, out vec4 c1, out vec4 c2){
        float x = (0.5 + float(idx)) / float(COMBINATIONS);
        c1 = texture2D(u_colors, vec2(x, 0.0));
        c2 = texture2D(u_colors, vec2(x, 2.0));
      }
      float dist(vec4 srcColor, vec4 color){
        float d = distance(srcColor, color);
        if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.3);
        return d;
      }
      float ditherIndex(){
        float p = floor(mod(gl_FragCoord.x, 4.0));
        float q = floor(mod(p - gl_FragCoord.y, 4.0));
        return (
          8.0 * mod(q, 2.0) +
          4.0 * mod(p, 2.0) +
          2.0 * floor(q / 2.0) +
          floor(p / 2.0) +
          0.5
        ) / 16.0;
      }
      float calculateBestRatio(vec4 srcColor, vec4 c1, vec4 c2){
        vec4 dif = c2 - c1;
        return floor(
          0.5 + dot(dif, srcColor - c1) / dot(dif, dif) * 16.0
        ) / 16.0;
      }
      vec4 dither(vec4 srcColor){
        vec4 c1, c2, canditate;
        float ratio;
        float d, minDist = 9.9;
        float index = ditherIndex();
        
        for(int i = 0; i < COMBINATIONS; i++){
          getColors(i, c1, c2);
          ratio = calculateBestRatio(srcColor, c1, c2);
          d =
            dist(srcColor, mix(c1, c2, clamp(ratio, 0.0, 1.0))) +
            distance(c1, c2) / 4.0;
          if(minDist > d){
            minDist = d;
            if(index > ratio){
              canditate = c1;
            } else {
              canditate = c2;
            }
          }
        }
        return canditate;
      }
        
      float filterComponent(float color){
        color = pow(color, u_brightness);
        if(color < 0.5){
          return 0.5 * pow(2.0 * color, 1.0 / u_contrast);
        } else {
          return 0.5 * pow(2.0 * color - 1.0, u_contrast) + 0.5;
        }
      }
      vec4 getSourceColor(){
        vec4 col = texture2D(u_source, v_texCoord);
        return vec4(
          filterComponent(col.r), filterComponent(col.g),
          filterComponent(col.b), 1.0
        );
      }
      void main(){
        gl_FragColor = dither(getSourceColor());
      }
    """
     
    reduceColor: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform sampler2D u_colors;

      uniform bool u_vivid;
      uniform float u_brightness;
      uniform float u_contrast;

      varying vec2 v_texCoord;
      
      const int COLORLEN = 32;
      
      vec4 getColor(int idx){
        float x = (0.5 + float(idx)) / float(COLORLEN);
        return texture2D(u_colors, vec2(x, 0.5));
      }
      float dist(vec4 srcColor, vec4 color){
        float d = distance(srcColor, color);
        if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.3);
        return d;
      }
      vec4 nearest(vec4 srcColor){
        vec4 col, minCol;
        float d, mind = 9.9;
        
        for(int i = 0; i < COLORLEN; i++){
          col = getColor(i);
          d = dist(srcColor, col);
          if(mind > d){
            minCol = col;
            mind = d;
          }
        }
        return minCol;
      }
        
      float filterComponent(float color){
        color = pow(color, u_brightness);
        if(color < 0.5){
          return 0.5 * pow(2.0 * color, 1.0 / u_contrast);
        } else {
          return 0.5 * pow(2.0 * color - 1.0, u_contrast) + 0.5;
        }
      }
      vec4 getSourceColor(){
        vec4 col = texture2D(u_source, v_texCoord);
        return vec4(
          filterComponent(col.r), filterComponent(col.g),
          filterComponent(col.b), 1.0
        );
      }
      void main(){
        gl_FragColor = nearest(getSourceColor());
      }
    """
    blueprint: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_unitSize;
      uniform vec2 u_bigUnitSize;
      uniform float u_scale;
      uniform sampler2D u_colors;

      varying vec2 v_texCoord;
      
      const int COLORLEN = 32;

      bool checked(vec4 color){
        float x;
        for(int i = 0; i < COLORLEN; i++){
          x = (0.5 + float(i)) / float(COLORLEN);
          if(color == texture2D(u_colors, vec2(x, 0.5))) return true;
        }
        return false;
      }
      float luma(vec4 color){
        return dot(vec3(0.3, 0.59, 0.11), color.rgb);
      }
      vec4 borderColor(vec4 color, float degree){
        if(luma(color) < 0.5) return color + vec4(degree);
        return color - vec4(vec3(degree), 0.0);
      }
      void main(){
        vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_scale;
        vec2 localCoord = mod(pos, u_unitSize);
        vec2 domainCoord = mod(pos, u_unitSize * u_bigUnitSize);
        vec4 color = texture2D(u_source, v_texCoord);
        
        if(any(equal(domainCoord, vec2(0.0)))){
          gl_FragColor = borderColor(color, 1.0);
        } else if(localCoord.x == localCoord.y && checked(color) ||
            any(equal(localCoord, vec2(0.0)))){
          gl_FragColor = borderColor(color, 0.3);
        } else {
          gl_FragColor = color;
        }
      }
    """

  constructor: ->
    @_img = document.createElement 'img'
    @_gl = new MicroGL(antialias: false)

  _renderGL: (width, height, fshader, source, variables={}) ->
    tex = @_gl.texture source
    @_gl
      .texParameter(tex, filter: 'NEAREST')
      .init(null, width, height)
      .program(@shader.vertex, fshader)
      .bindVars(
        a_position: [-1,-1, -1,1, 1,-1, 1,1]
        u_source: tex
      )
      .bindVars(variables)
      .draw().gl.canvas

  _reduceColor: ->
    if @dither
      shader = @shader.reduceColorDithered
      colorCanv = colorsToCanvas(128, 2,
        SuperArray::combinations.call(
          (c.color for c in @colors when c.use), 2
        ).sort(
          ([a1, a2], [b1, b2]) -> a1.dist(a2) - b1.dist(b2)
        ).slice(0, 128)
      )
    else
      shader = @shader.reduceColor
      colorCanv = colorsToCanvas 32, 1, ([c.color] for c in @colors when c.use)
    
    # draw on canvas: @colorReduced
    canv = document.createElement 'canvas'
    @colorReduced = canv.getContext '2d'
    canv.width = @width
    canv.height = @height =
      @width * @unitWidth / @unitHeight * @_img.height / @_img.width |0
    @colorReduced.drawImage(
      @_renderGL(
        @width, @height,
        shader, @_img,
        u_colors: colorCanv
        u_vivid: @vivid
        u_brightness: Math.exp(-@brightness)
        u_contrast: Math.exp(-@contrast)
      )
    , 0, 0)

  render: (source, callback) ->
    #@_resetColorAmount()
    if source
      @_img.onload = =>
        @_reduceColor()
        callback?()
      @_img.src = source
    else
      @_reduceColor()
      callback?()

  getThumbnail: ->
    @_renderGL(
      @width * @unitWidth, @height * @unitHeight,
      @shader.noop, @colorReduced.canvas
    )

  getBlueprint: ->
    check = colorsToCanvas 32, 1, ([c.color] for c in @colors when c.checked)
    @_renderGL(
      @width * @unitWidth * 4, @height * @unitHeight * 4,
      @shader.blueprint, @colorReduced.canvas,
      u_scale: 4,
      u_unitSize: [@unitWidth, @unitHeight]
      u_bigUnitSize: [4, 7 - @unitHeight / 2 |0]
      u_colors: check
    )


# models and views
class Palette extends Model
  constructor: (@colors=[]) ->
    @_idx = {}
    for c, i in @colors
      @_idx[c.name] = i

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
  unuse: (name) ->
    color = @color(name)
    color.use = color.checked = false
    @change()

  check: (name) ->
    @color(name).checked = true
    @change()
  uncheck: (name) ->
    @color(name).checked = false
    @change()

  resetAmount: ->
    for color in @colors
      color.amount = 0
  setAmount: (name, value) ->
    @color(name).amount = value
    @change()


class PaletteView extends View
  constructor: (model, @elem) ->
    super model

    frag = document.createDocumentFragment()
    for c in @model.colors
      li = document.createElement 'li'
      li.style.backgroundColor = c.color.toString()
      li.dataset.name = c.name
      frag.appendChild li
    @elem.appendChild frag

    @elem.addEventListener 'click', (e) =>
      name = e.target.dataset.name
      color = @model.color(name)
      return unless color
      if color.checked
        @model.unuse name
      else if color.use
        @model.check name
      else
        @model.use name
    , false

    @render()

  render: ->
    for li in @elem.childNodes
      color = @model.color(li.dataset.name)
      classes = []
      if color.use
        classes.push 'color-use'
      if color.checked
        classes.push 'color-checked'
      li.className = classes.join ' '


cancelEvent = (e) ->
  e.stopPropagation()
  e.preventDefault()

# main
main = ->
  colors = [
    ['Black',              33,  33,  33, true]
    ['Dark Gray',         107,  90,  90, true]
    ['Light Gray',        156, 156, 156, true]
    ['Very Light Gray',   232, 232, 232, true, true]
    ['White',             255, 255, 255, true]
    ['Dark Bluish Gray',   89,  93,  96]
    ['Light Bluish Gray', 175, 181, 199]
    ['Blue',                0,  87, 166]
    ['Red',               179,   0,   6]
    ['Yellow',            247, 209,  23]
    ['Green',               0, 100,  46]
    ['Tan',               222, 198, 156]
    ['Reddish Brown',     137,  53,  29]
    ['Dark Blue',          20,  48,  68]
    ['Bright Pink',       243, 154, 194]
    ['Brown',              83,  33,  21]
    ['Dark Purple',        95,  38, 131]
    ['Dark Red',          106,  14,  21]
    ['Dark Tan',          144, 116,  80]
    ['Dark Turquoise',      0, 138, 128]
    ['Lime',              166, 202,  85]
    ['Maersk Blue',       107, 173, 214]
    ['Medium Blue',        97, 175, 255]
    ['Medium Lavender',   181, 165, 213]
    ['Medium Orange',     255, 165,  49]
    ['Orange',            255, 126,  20]
    ['Pink',              255, 199, 225]
    ['Purple',            165,  73, 156]
    ['Sand Blue',          90, 113, 132]
    ['Sand Green',        118, 162, 144]
  ]
  palette = new Palette(
    for [name, r, g, b, use, checked] in colors
      { name, color: new Color(r, g, b), use, checked }
  )
  new PaletteView(palette, $ 'palette')

  ctx = $('canv').getContext '2d'
  proc = new ImageProcessor()
  proc.colors = palette.colors
  rendered = false

  render = (file) ->
    if file
      return unless ~file.type.indexOf 'image'
      url = window.URL.createObjectURL file
    else if not rendered
      return
    proc.render url, ->
      thumb = proc.getThumbnail()
      ctx.canvas.width = thumb.width
      ctx.canvas.height = thumb.height
      ctx.drawImage thumb, 0, 0
      rendered = true

  document.body.addEventListener 'dragenter', cancelEvent, false
  document.body.addEventListener 'dragover', cancelEvent, false
  document.body.addEventListener 'drop', (e) ->
    cancelEvent(e)
    render e.dataTransfer?.files?[0]
  , false
  $('form').addEventListener 'change', (e) ->
    target = e.target
    if target.tagName.toUpperCase() is 'INPUT'
      proc[target.name] =
        if target.type is 'checkbox' then target.checked else +target.value
      render()
  , false
  $('render-button').addEventListener 'click', ->
    if rendered
      window.open proc.getBlueprint().toDataURL('image/png')
  , false

  eve.on "#{palette._uuid}.change", render

document.addEventListener 'DOMContentLoaded', main, false