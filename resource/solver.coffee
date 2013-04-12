class Solver
  ###
    items = [item]
    item = { id, part, color, amount, stores }
    stores = [store]
    store = { id, name, items }
    matrix = (item, store) -> { price, localId }
  ###
  jointAsSet = (a1, a2) ->
    res = [].concat(a1)
    for item in a2
      if item not in a1
        res.push(item)
    res

  calcStores = (items, stores, storeNum) ->
    return [[]] if items.length is 0
    return [] if storeNum is 0

    result = []
    threshold = items.length / storeNum
    for store, idx in stores
      # 買えない item
      restItems = items.filter (item) -> item not in store.items
      if items.length - restItems.length < threshold
        continue
      restStores = stores.slice(idx)
      for comb in calcStores(restItems, restStores, storeNum - 1)
        result.push [store].concat(comb)
    result

  totalPrice = (items, stores, matrix) ->
    res = 0
    for item, i in items
      store = stores[i]
      res += matrix.get(item, store).price * item.amount
    res

  solve: (items, stores, matrix) ->
    stores = new SuperArray(stores)

    # まず店の最小の数を貪欲に概算する
    buyableItems = []
    minStoreNum = 0
    while buyableItems.length < items.length
      largest = stores.maxBy (store) ->
        store.items.filter((item) -> item not in buyableItems).length
      buyableItems = jointAsSet(buyableItems, largest.items)
      minStoreNum++

    storeLists = calcStores(items, stores, minStoreNum)

    # それぞれの店の組み合わせについて最も安い買い方を調べる
    solutions = (for storeList in storeLists
      for item in items
        new SuperArray(storeList).minBy (store) ->
          matrix.get(item, store)?.price or Infinity
    )
    solutions.sort (a, b) ->
      totalPrice(items, a, matrix) - totalPrice(items, b, matrix)


class ItemStoreMatrix
  constructor: -> @map = {}
  set: (item, store, value) ->
    row = @map[item.id] or= {}
    row[store.id] = value
  get: (item, store) ->
    @map[item.id]?[store.id]