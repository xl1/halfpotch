class SelectModel extends Model # window.Select is reserved
  constructor: (@type) ->
    super
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

  remove: ->
    item = @item
    @item = null
    idx = @options.indexOf item
    @options.splice(idx, 1)
    @change()
    item

  setItem: (id) ->
    for option in @options
      if option.id is id
        @item = option
        @change 'select', option
        return
    return


class SelectView extends View
  constructor: (model, @elem) ->
    super
    model.listen 'add', @add.bind @

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
    super
    img = document.createElement 'img'
    elem.appendChild img
    model.listen 'select', (item) ->
      colorId = item.colors[0].id
      img.onerror = ->
        @src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.jpg"
        @onerror = null
      img.src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.gif"


class DataProcessor extends Model
  constructor: ->
    super
    @items = []
    @stores = []
    @matrix = new ItemStoreMatrix()
    @_loader = new StoreDataLoader()
    @_solver = new Solver()

  process: (@items) ->
    params = (for item in items
      { part: item.part.id, color: item.color.id, amount: item.amount }
    )
    @_loader.load (data) =>
      @makeMatrix(data)
      @result = @_solver.solve(@items, @stores, @matrix)
      @change()
    , params

  makeMatrix: (storeData) ->
    storeMap = {}
    for sData, id in storeData
      for s in sData
        store = storeMap[s.id] or= {
          id: s.id
          name: s.name
          items: []
        }
        item = items[id]
        store.items.push item
        item.stores.push store
        @matrix.set(item, store, {
          price: s.price
          url: s.url
        })
    @stores = (storeMap[key] for key of Object.key storeMap)


class ResultView extends View
  constructor: (model, @elem) ->
    super
    @elem.textContent = 'calculating...'

  _td: (text) ->
    td = document.createElement 'td'
    td.appendChild document.createTextNode(text)
    td

  _createRow: (item, store) ->
    { price, url } = @model.matrix.get(item, store)
    text = escapeHTML(item.color.name + ' ' + item.part.name)

    tr = document.createElement 'tr'
    tr.insertAdjacentHTML 'beforeend', """
      <td>
        <span class="color-box"
          style="background-color: #{escapeHTML item.color.rgb};"></span>
        #{text}
      </td>
      <td>
        <a href="#{escapeHTML url}">#{escapeHTML store.name}</a>
      </td>
    """
    tr.appendChild @_td(price)
    tr.appendChild @_td(item.amount)
    tr.appendChild @_td((price * item.amount).toFixed 2)
    tr

  _createTable: (solution) ->
    table = document.createElement 'table'
    table.insertAdjacentHTML 'beforeend', '<th><td>部品</td><td>店名</td><td>単価（円）</td><td>個数</td><td>小計</td></th>'
    for store, i in solution
      item = @model.items[i]
      table.appendChild @_createRow(item, store)
    table

  show: ->
    @elem.style.display = 'block'
  hide: ->
    @elem.style.display = 'none'

  render: ->
    @elem.innerHTML = ''
    for solution in @model.result.slice(0, 20)
      @elem.appendChild @_createTable(solution)



do ->
  categorySelect = new SelectModel 'category'
  partSelect     = new SelectModel 'part'
  colorSelect    = new SelectModel 'color'
  cartSelect     = new SelectModel 'cart'
  cart           = new Assoc()
  processor      = new DataProcessor()

  cart.listen (type, id) ->
    switch type
      when 'category'
        categorySelect.setItem(id)
        partSelect.reset(categorySelect.item.parts)
        colorSelect.reset []
      when 'part'
        partSelect.setItem(id)
        colorSelect.reset(partSelect.item.colors)
      when 'color'
        colorSelect.setItem(id)
      when 'cart'
        cartSelect.setItem(id)

  addItem = ->
    part = partSelect.item
    color = colorSelect.item
    amount = cart.get 'amount'
    if part and color and amount
      cartSelect.add { id: uuid(), part, color, amount }
  removeItem = ->
    cartSelect.remove()
  editItem = ->
    item = removeItem()
    return unless item
    { part, color, amount } = item
    cart.set 'category', part.categoryId
    cart.set 'part', part.id
    cart.set 'color', color.id
    cart.set 'amount', amount
  calculate = ->
    processor.process(cartSelect.options)

  document.addEventListener 'DOMContentLoaded', ->
    new SelectView(categorySelect, $('categorySelect'))
    new SelectView(partSelect, $('partSelect'))
    new PartImageView(partSelect, $('image'))
    new ColorSelectView(colorSelect, $('colorSelect'))
    new CartSelectView(cartSelect, $('cart'))
    new FormView(cart, $('form'))

    $('addButton').addEventListener 'click', addItem, false
    $('editButton').addEventListener 'click', editItem, false
    $('removeButton').addEventListener 'click', removeItem, false
    $('calculateButton').addEventListener 'click', calculate, false
  , false

  new DataLoader().load (data) ->
    categorySelect.reset data.categories
