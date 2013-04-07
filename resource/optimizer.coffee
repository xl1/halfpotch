class Cart extends Model
  constructor: ->
    super()
    @select = new SelectModel('cart')

  register: (part, color, amount) ->
    if part and color and amount
      @select.add { id: uuid(), part, color, amount }
  
  calculate: ->


class SelectModel extends Model # window.Select is reserved
  constructor: (@type) ->
    super()
    @item = null
    @options = []

  reset: (source) ->
    @options = []
    ids = Object.keys(source).sort (a, b) ->
      source[a].name.localeCompare source[b].name
    for id in ids
      @add source[id], false
    @change()

  add: (item, change=true) ->
    @options.push item
    if change
      @change 'add', item

  setItem: (id) ->
    for option in @options
      if option.id is id
        @item = option
        @change 'select', option
        return


class SelectView extends View
  constructor: (model, @elem) ->
    super model
    model.listen 'add', @add.bind @
    elem.addEventListener 'change', (e) ->
      model.setItem e.target.value
    , false

  _createLi: (item) ->
    type = escapeHTML @model.type
    id = escapeHTML item.id
    li = document.createElement 'li'
    li.insertAdjacentHTML 'beforeend', """
      <input type="radio" id="#{type + id}" name="#{type}" value="#{id}">
      <label for="#{type + id}">#{escapeHTML item.name}</label>
    """
    li

  add: (option) ->
    @elem.appendChild @_createLi(option)

  render: ->
    @elem.innerHTML = ''
    frag = document.createDocumentFragment()
    for option in @model.options
      frag.appendChild @_createLi(option)
    @elem.appendChild frag

class ColorSelectView extends SelectView
  _createLi: (item) ->
    id = escapeHTML item.id
    li = document.createElement 'li'
    li.insertAdjacentHTML 'beforeend', """
      <input type="radio" id="color#{id}" name="color" value="#{id}">
      <label for="color#{id}">
        <span class="color-box"
          style="background-color: #{escapeHTML item.rgb};"></span>
        #{escapeHTML item.name}
      </label>
    """
    li

class CartSelectView extends SelectView
  _createLi: (item) ->
    id = escapeHTML item.id
    text = escapeHTML "(#{item.amount}x) #{item.color.name} #{item.part.name}"
    li = document.createElement 'li'
    li.insertAdjacentHTML 'beforeend', """
      <input type="radio" id="cart#{id}" name="cart" value="#{id}">
      <label for="cart#{id}">
        <span class="color-box"
          style="background-color: #{escapeHTML item.color.rgb};"></span>
        #{text}
      </label>
    """
    li

class PartImageView extends View
  constructor: (model, @elem) ->
    super model
    img = document.createElement 'img'
    elem.appendChild img
    model.listen 'select', (item) ->
      colorId = item.colors[0].id
      img.onerror = ->
        @src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.jpg"
        @onerror = null
      img.src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.gif"


main = ->
  categorySelect = new SelectModel 'category'
  partSelect     = new SelectModel 'part'
  colorSelect    = new SelectModel 'color'
  cart           = new Cart()
  form           = new Assoc()
  new SelectView(categorySelect, $('categorySelect'))
  new SelectView(partSelect, $('partSelect'))
  new PartImageView(partSelect, $('image'))
  new ColorSelectView(colorSelect, $('colorSelect'))
  new CartSelectView(cart.select, $('cart'))
  new FormView(form, $('form'))

  categorySelect.listen 'select', (category) ->
    partSelect.reset category.parts
    colorSelect.reset []
  partSelect.listen 'select', (part) ->
    colorSelect.reset part.colors

  $('addButton').addEventListener 'click', ->
    cart.register(partSelect.item, colorSelect.item, form.get('amount'))
  , false
  $('calculateButton').addEventListener 'click', ->
    cart.calculate()
  , false

  new DataLoader().load (data) ->
    categorySelect.reset data.categories


document.addEventListener 'DOMContentLoaded', main, false