# utilities
$ = (id) -> document.getElementById id

class SuperArray
  minBy: (func) ->
    min = Infinity
    solution = null
    for d in @
      res = func(d)
      [min, solution] = [res, d] if min > res
    solution

  maxBy: (func) -> @minBy (d) -> -func(d)
  min: -> @minBy (d) -> d
  max: -> @minBy (d) -> -d

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

      void main(){
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    """
    noop: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_sourceSize;

      void main(){
        gl_FragColor = texture2D(u_source, gl_FragCoord.xy / u_sourceSize);
      }
    """
    
    reduceColorDithered: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_sourceSize;
      uniform sampler2D u_colors;

      uniform bool u_vivid;
      uniform float u_brightness;
      uniform float u_contrast;
    
      const int COMBINATIONS = 128;
      
      void getColors(in int idx, out vec4 c1, out vec4 c2){
        float x = (0.5 + float(idx)) / float(COMBINATIONS);
        c1 = texture2D(u_colors, vec2(x, 0.0));
        c2 = texture2D(u_colors, vec2(x, 2.0));
      }
      float dist(vec4 srcColor, vec4 color){
        float d = distance(srcColor, color);
        if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);
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
            dist(srcColor, mix(c1, c2, clamp(ratio, 1.0, 0.0))) +
            distance(c1, c2) * 0.1;
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
        vec4 col = texture2D(u_source, gl_FragCoord.xy / u_sourceSize);
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
      uniform vec2 u_sourceSize;
      uniform sampler2D u_colors;

      uniform bool u_vivid;
      uniform float u_brightness;
      uniform float u_contrast;
      
      const int COLORLEN = 32;
      
      vec4 getColor(int idx){
        float x = (0.5 + float(idx)) / float(COLORLEN);
        return texture2D(u_colors, vec2(x, 0.5));
      }
      float dist(vec4 srcColor, vec4 color){
        float d = distance(srcColor, color);
        if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);
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
        vec4 col = texture2D(u_source, gl_FragCoord.xy / u_sourceSize);
        return vec4(
          filterComponent(col.r), filterComponent(col.g),
          filterComponent(col.b), 1.0
        );
      }
      void main(){
        gl_FragColor = nearest(getSourceColor());
      }
    """
    thumbnail: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_sourceSize;
      uniform vec2 u_unitSize;

      void main(){
        vec2 pos = floor(gl_FragCoord.xy / u_unitSize) + vec2(0.5);
        gl_FragColor = texture2D(u_source, pos / u_sourceSize);
      }
    """
    blueprint: """
      precision mediump float;
      uniform sampler2D u_source;
      uniform vec2 u_sourceSize;
      uniform vec2 u_unitSize;
      uniform vec2 u_bigUnitSize;
      uniform float u_scale;
      uniform sampler2D u_check;
      
      const int COLORLEN = 32;

      float checked(vec4 color){
        float x;
        
        for(int i = 0; i < COLORLEN; i++){
          x = (0.5 + float(i)) / float(COLORELEN);
          if(color == texture2D(u_check, vec2(x, 0.0)){
            return texture2D(u_check, vec2(x, 2.0)).a
          }
        }
        return 0.0;
      }
      bool isOnGrid(vec2 unit){
        vec2 m = mod(gl_FragCoord.xy - vec2(0.5), unit);
        return m.x == 0.0 || m.y == 0.0;
      }
      float luma(vec4 color){
        return dot(vec3(0.3, 0.59, 0.11), color.rgb);
      }
      void main(){
        vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_unitSize / u_scale;
        vec2 posf = floor(pos);
        vec4 color = texture2D(u_source, (posf + vec2(0.5)) / u_sourceSize);
        if(pos.x - pos_f.x == 0.0 || pos.y - pos_f.y == 0.0){
          if(luma(color) < 0.5){
            color += vec4(0.4);
          } else {
            color -= vec4(0.4, 0.4, 0.4, 0.0);
          }
        }
        gl_FragColor = color;
      }
    """

  constructor: ->
    @_img = document.createElement 'img'
    @_ctx = document.createElement('canvas').getContext '2d'
    colorCanv = document.createElement('canvas')
    @_colorCtx = colorCanv.getContext '2d'
    @_gl = new MicroGL(antialias: false)

  _scale: ->
    canv = @_ctx.canvas
    canv.width = @width
    canv.height = @_canvasHeight =
      @width * @unitWidth / @unitHeight * @_img.height / @_img.width |0
    @_ctx.drawImage @_img, 0, 0, canv.width, canv.height

  _renderGL: (width, height, fshader, source, target, variables={}) ->
    @_gl
      .init(null, width, height)
      .program(@shader.vertex, fshader)
      .bindVars(
        a_position: [-1,-1, -1,1, 1,-1, 1,1]
        u_source: source
        u_sourceSize: [source.width, source.height]
        u_unitSize: [@unitWidth, @unitHeight]
      )
      .bindVars(variables)
    if target then @_gl.drawFrame(target) else @_gl.draw()
    
  _createCombination: (max=128) ->
    colors = []
    colorNames = Object.keys @colors
    i = 0
    for ii in [0...colorNames.length]
      c1 = @colors[colorNames[ii]]
      continue unless c1.use
      for jj in [0...ii]
        c2 = @colors[colorNames[jj]]
        continue unless c2.use
        colors.push [c1, c2]
    
    colors.sort ([a1, a2], [b1, b2]) ->
      a1.color.dist(a2.color) - b1.color.dist(b2.color)
    colors.slice(0, max)

  _reduceColor: ->
    colorCanv = @_colorCtx.canvas
    
    if @dither
      shader = @shader.reduceColorDithered
    
      colorCanv.width = 128
      colorCanv.height = 2
      colorData = @_colorCtx.createImageData(128, 2)

      for [c1, c2], i in @_createCombination(128)
        colorData.data.set([
          c1.color.r, c1.color.g, c1.color.b, 255
        ], i << 2)
        colorData.data.set([
          c2.color.r, c2.color.g, c2.color.b, 255
        ], (i + 128) << 2)
    else
      shader = @shader.reduceColor
      
      colorCanv.width = 32
      colorCanv.height = 1
      colorData = @_colorCtx.createImageData(32, 1)
      for name, i in Object.keys @colors
        c1 = @colors[name]
        continue unless c1.use
        colorData.data.set([
          c1.color.r, c1.color.g, c1.color.b, 255
        ], i << 2)
      
    @_colorCtx.putImageData colorData, 0, 0
    
    # draw on frame buffer: @colorReduced
    canv = @_ctx.canvas
    { width, height } = canv
    @colorReduced = @_gl.frame width, height
    @colorReduced.color.width = width
    @colorReduced.color.height = height

    @_renderGL(
      @width,
      @_canvasHeight,
      shader,
      canv,
      @colorReduced,
      u_colors: colorCanv
      u_vivid: @vivid
      u_brightness: Math.exp(-@brightness)
      u_contrast: Math.exp(-@contrast)
    )

  render: (source, callback) ->
    #@_resetColorAmount()
    if source
      @_img.onload = =>
        @_scale()
        @_reduceColor()
        callback?()
      @_img.src = source
    else
      @_scale()
      @_reduceColor()
      callback?()

  getThumbnail: ->
    canv = @_ctx.canvas
    @_renderGL(
      @width * @unitWidth,
      @_canvasHeight * @unitHeight,
      @shader.thumbnail,
      @colorReduced.color
    ).gl.canvas

  getBlueprint: ->
    canv = @_gl.gl.canvas
    @_renderGL(
      @width * @unitWidth * 4,
      @_canvasHeight * @unitHeight * 4,
      @shader.blueprint,
      @colorReduced.color,
      null,
      u_scale: 4
    ).gl.canvas


# models and views
class Palette extends Model
  colors:
    'Black':             color: new Color( 33,  33,  33), use: true
    'Dark Gray':         color: new Color(107,  90,  90), use: true
    'Light Gray':        color: new Color(156, 156, 156), use: true
    'Very Light Gray':   color: new Color(232, 232, 232), use: true, check: true
    'White':             color: new Color(255, 255, 255), use: true
    'Dark Bluish Gray':  color: new Color( 89,  93,  96)
    'Light Bluish Gray': color: new Color(175, 181, 199)
    'Blue':              color: new Color(  0,  87, 166)
    'Red':               color: new Color(179,   0,   6)
    'Yellow':            color: new Color(247, 209,  23)
    'Green':             color: new Color(  0, 100,  46)
    'Tan':               color: new Color(222, 198, 156)
    'Reddish Brown':     color: new Color(137,  53,  29)
    'Dark Blue':         color: new Color( 20,  48,  68)
    'Bright Pink':       color: new Color(243, 154, 194)
    'Brown':             color: new Color( 83,  33,  21)
    'Dark Purple':       color: new Color( 95,  38, 131)
    'Dark Red':          color: new Color(106,  14,  21)
    'Dark Tan':          color: new Color(144, 116,  80)
    'Dark Turquoise':    color: new Color(  0, 138, 128)
    'Lime':              color: new Color(166, 202,  85)
    'Maersk Blue':       color: new Color(107, 173, 214)
    'Medium Blue':       color: new Color( 97, 175, 255)
    'Medium Lavender':   color: new Color(181, 165, 213)
    'Medium Orange':     color: new Color(255, 165,  49)
    'Orange':            color: new Color(255, 126,  20)
    'Pink':              color: new Color(255, 199, 225)
    'Purple':            color: new Color(165,  73, 156)
    'Sand Blue':         color: new Color( 90, 113, 132)
    'Sand Green':        color: new Color(118, 162, 144)

  use: (name) ->
    @colors[name].use = true
    @change()
  unuse: (name) ->
    color = @colors[name]
    color.use = color.checked = false
    @change()

  check: (name) ->
    @colors[name].checked = true
    @change()
  uncheck: (name) ->
    @colors[name].checked = false
    @change()

  resetAmount: ->
    for color in @colors
      color.amount = 0
  setAmount: (name, value) ->
    @colors[name].amount = value
    @change()


class PaletteView extends View
  constructor: (model, @elem) ->
    super model

    colors = @model.colors

    frag = document.createDocumentFragment()
    for name in Object.keys colors
      color = colors[name]
      li = document.createElement 'li'
      li.style.backgroundColor = color.color.toString()
      li.dataset.name = name
      frag.appendChild li
    @elem.appendChild frag

    @elem.addEventListener 'click', (e) =>
      name = e.target.dataset.name
      return unless name
      if colors[name].checked
        @model.unuse name
      else if colors[name].use
        @model.check name
      else
        @model.use name
    , false

    @render()

  render: ->
    for li in @elem.childNodes
      name = li.dataset.name
      color = @model.colors[name]
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
  palette = new Palette()
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