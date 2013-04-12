items = ({ id, stores: [], amount: 1 } for id in [0, 1, 2, 3, 4, 5])
storeData = []
storeData[0] = [
  { id: 0, price: 4 }
  { id: 1, price: 3 }
  { id: 2, price: 5 }
  { id: 3, price: 4 }
  { id: 4, price: 2 }
]
storeData[1] = [
  { id: 0, price: 7 }
  { id: 5, price: 6 }
]
storeData[2] = [
  { id: 0, price: 10 }
  { id: 1, price: 6 }
]
storeData[3] = [
  { id: 2, price: 4 }
  { id: 3, price: 3 }
]
storeData[4] = [
  { id: 3, price: 10 }
  { id: 4, price: 2 }
]
storeData[5] = [
  { id: 5, price: 5 }
]

# 最小の店の数: 3
# 2店での買い方: [0, 3, 5], [1, 3, 5]
# 値段: 4+6+10+3+10+5 = 38, 3+6+9+3+10+5 = 36

matrix = new ItemStoreMatrix()

storeMap = {}
for sData, id in storeData
  for s in sData
    store = storeMap[s.id] or= { id: s.id, items: [] }
    item = items[id]
    store.items.push item
    item.stores.push store
    matrix.set(item, store, { price: s.price })

stores = (store for own _, store of storeMap)

describe 'Solver#solve()', ->
  solver = new Solver()
  it 'should find best solution for buying items', ->
    solutions = solver.solve(items, stores, matrix)
    expect(solutions.length).toBe 2
    expect(s.id for s in solutions[0]).toEqual [1, 5, 1, 3, 3, 5]
    expect(s.id for s in solutions[1]).toEqual [0, 5, 0, 3, 3, 5]