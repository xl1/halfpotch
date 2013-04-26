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


class Router
  constructor: (@select) ->
    select.listen 'add', =>
      query = @dump(select.options)
      window.history.replaceState(query, null, '?o=' + query)

  setData: (@data) ->
    query = /[?&]o=([\w,|]*)/.exec(location.search)?[1]
    items = @load(query)
    for item in items
      @select.add(item, false)
    @select.change()

  dump: (items) ->
    (for { part, color, amount } in items
      "#{part.id},#{color.id},#{amount}"
    ).join '|'

  load: (str) ->
    return [] unless str
    result = []
    for s in str.split '|'
      [id, colorId, amount] = s.split ','
      part = @data.parts[id]
      color = @data.colors[colorId]
      if part and color
        amount = if amount > 0 then amount |0 else 1
        result.push { id: uuid(), part, color, amount }
    result


class Searcher
  constructor: ->
    @options = []
    @data = []

  setData: (source) ->
    @data = (source[key] for key in Object.keys source)

  tokenize: (query) ->
    query.toLowerCase().split(/[,\s]+/).filter (str) -> str.length >= 2
  convertToken: (token) ->
    token
      # "1x2x5" -> "1 x 2 x 5"
      .replace(/([\/\.\d]+)(x)([\/\.\d]*)(x?)([\/\.\d]*)/, (arg...) ->
        arg[1..5].join(' ').trim()
      )
      .replace(/\+/g, ' ')

  match: (text, tokens) ->
    return if (not text) or (tokens.length is 0)
    text = text.toLowerCase()
    for t in tokens when text.indexOf(t) is -1
      return false
    return true

  search: (query) ->
    tokens = (@convertToken(t) for t in @tokenize query)
    options = []
    for item in @data when @match(item.name, tokens)
      options.push item
      if options.length > 100
        break
    @options = options