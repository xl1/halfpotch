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

  reset: ->
    @items = []
    @change 'reset'

  process: (@items) ->
    params = (for item in items
      { part: item.part.id, color: item.color.id, amount: item.amount }
    )
    @_loader.load (data) =>
      @makeMatrix(data)
      @result = @_solver.solve(@items, @stores, @matrix)
      @change()
    , =>
      @change 'error'
    , params
    @change 'start'

  makeMatrix: (storeData) ->
    storeMap = {}
    for sData, id in storeData
      item = @items[id]
      item.stores = []
      for s in sData
        store = storeMap[s.id] or= {
          id: s.id
          name: s.name
          items: []
        }
        store.items.push item
        item.stores.push store
        @matrix.set(item, store, {
          price: s.price
          url: s.url
        })
    @stores = (storeMap[key] for key in Object.keys storeMap)


class ResultView extends View
  constructor: (model, @elem) ->
    super
    model.listen 'reset', @hide.bind(@)
    @showing = false

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
        <a href="http://www.bricklink.com#{escapeHTML url}" target="_blank">
          #{escapeHTML store.name}
        </a>
      </td>
    """
    tr.appendChild @_td(price)
    tr.appendChild @_td(item.amount)
    tr.appendChild @_td((price * item.amount).toFixed 2)
    tr

  _createTable: (solution) ->
    frag = document.createDocumentFragment()
    header = document.createElement 'tr'
    header.innerHTML = '<th>部品</th><th>店名</th><th>単価（円）</th><th>個数</th><th>小計</th>'
    frag.appendChild header

    wholePrice = 0
    for store, i in solution
      item = @model.items[i]
      frag.appendChild @_createRow(item, store)
      wholePrice += @model.matrix.get(item, store).price * item.amount

    footer = document.createElement 'tr'
    footer.innerHTML = "<td colspan='3'><td>合計</td><td><b>#{wholePrice.toFixed 2}</b></td>"
    frag.appendChild footer
    frag

  hide: ->
    @elem.className = ''
    @showing = false
  
  render: ->
    return unless @model.result.length
    @elem.innerHTML = ''
    table = document.createElement 'table'
    tbody = document.createElement 'tbody'
    for solution in @model.result.slice(0, 20)
      tbody.appendChild @_createTable(solution)
    table.appendChild tbody
    @elem.appendChild table
    @elem.className = 'displayed'
    @showing = true


class ProgressButton extends View
  constructor: (model, @elem) ->
    super
    model.listen 'start', @start.bind(@)
    model.listen 'error', @error.bind(@)
    model.listen 'reset', @reset.bind(@)
    @reset()

  _setBackground: (color) ->
    @elem.style.backgroundColor = color

  error: ->
    @elem.disabled = false
    @elem.value = 'エラー、あとでやり直してください'
    @elem.className = 'button error'
    setTimeout @reset.bind(@), 3000
  start: ->
    @elem.disabled = true
    @elem.value = 'データを集めています...'
  reset: ->
    @elem.disabled = false
    @elem.value = 'このパーツで店を探す'
    @elem.className = 'button'
  render: ->
    @elem.disabled = false
    if @model.result.length
      # end calculation successfully
      @elem.value = 'パーツを選びなおす'
      @elem.className = 'button'
    else
      @elem.value = 'パーツを減らしてください'
      @elem.className = 'button error'
      setTimeout @reset.bind(@), 3000


class Searcher extends SelectModel
  setData: (@data) ->

  tokenize: (query) ->
    query.split(/[,\s]+/).filter (str) -> str.length >= 2
  convertToken: (token) ->
    token
      # "1x2x5" -> "1 x 2 x 5"
      .replace(/([\/\.\d]+)(x)([\/\.\d]*)(x?)([\/\.\d]*)/, (arg...) ->
        arg[1..5].join(' ').trim()
      )
      .replace(/\+/g, ' ')
      .toLowerCase()

  score: (text, tokens) ->
    return 0 if tokens.length is 0
    text = text.toLowerCase()
    for t in tokens when text.indexOf(t) is -1
      return 0
    return 1


  search: (query) ->
    tokens = (@convertToken(t) for t in @tokenize query)
    
    scoreMap = {}
    matched = []
    for id in Object.keys @data
      item = @data[id]
      score = @score(item.name, tokens)
      if score
        scoreMap[id] = score
        matched.push item

    @options = matched.sort (a, b) -> scoreMap[b.id] - scoreMap[a.id]
    @change()
    @options


do ->
  categorySelect = new SelectModel 'category'
  partSelect     = new SelectModel 'part'
  colorSelect    = new SelectModel 'color'
  cartSelect     = new SelectModel 'cart'
  cart           = new Assoc()
  processor      = new DataProcessor()
  searcher       = new Searcher 'search'

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

  document.addEventListener 'DOMContentLoaded', ->
    new SelectView(categorySelect, $('categorySelect'))
    new SelectView(partSelect, $('partSelect'))
    #new SelectView(searcher, $('partSelect'))
    new PartImageView(partSelect, $('image'))
    new ColorSelectView(colorSelect, $('colorSelect'))
    new CartSelectView(cartSelect, $('cart'))
    new FormView(cart, $('form'))
    resultView = new ResultView(processor, $('result'))
    new ProgressButton(processor, $('calculateButton'))

    $('addButton').addEventListener 'click', addItem, false
    $('editButton').addEventListener 'click', editItem, false
    $('removeButton').addEventListener 'click', removeItem, false
    $('calculateButton').addEventListener 'click', ->
      if resultView.showing
        processor.reset()
      else
        processor.process(cartSelect.options)
    , false
    $('searchBox').addEventListener 'input', ->
      partSelect.reset searcher.search(@value)
    , false
  , false

  new DataLoader().load (data) ->
    categorySelect.reset data.categories
    searcher.setData data.parts