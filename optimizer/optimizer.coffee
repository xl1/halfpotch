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
    @elem.appendChild img
    model.listen 'select', (item) ->
      colorId = item.colors[0].id
      img.onerror = ->
        @src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.jpg"
        @onerror = null
      img.src = "http://img.bricklink.com/P/#{colorId}/#{item.id}.gif"


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
        <a href="http://www.bricklink.com/catalogPG.asp?P=#{item.part.id}&colorID=#{item.color.id}" target="_blank">
          #{text}
        </a>
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


do ->
  categorySelect = new SelectModel 'category'
  partSelect     = new SelectModel 'part'
  colorSelect    = new SelectModel 'color'
  cartSelect     = new SelectModel 'cart'
  cart           = new Assoc()
  processor      = new DataProcessor()
  searcher       = new Searcher()
  router         = new Router(cartSelect)

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
    router.setData data