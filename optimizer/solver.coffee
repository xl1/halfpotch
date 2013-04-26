class Solver
  ###
    items = [item]
    item = { id, part, color, amount, stores }
    stores = [store]
    store = { id, name, items }
    matrix = (item, store) -> { price }
  ###
  jointAsSet = (a1, a2) ->
    res = [].concat(a1)
    for item in a2 when item not in a1
      res.push(item)
    res

  calcStores = (items, stores, storeNum) ->
    # stores is sorted by ::items.length
    return [[]] if items.length is 0
    return [] if storeNum is 0

    result = []
    threshold = items.length / storeNum
    for store, idx in stores
      if store.items.length < threshold
        return result
      restItems = items.filter (item) -> item not in store.items
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
    # まずそもそも買えるのかどうか
    for item in items when item.stores.length is 0
      return []

    stores = new SuperArray(stores.sort (a, b) ->
      b.items.length - a.items.length
    )

    # 店の最小の数を貪欲に概算する
    buyableItems = stores[0].items
    minStoreNum = 1
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