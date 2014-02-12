injector = angular.injector ['ng', 'logger']
lotsTextParserTestText = '''
[New] Black Brick, Modified 1 x 2 with Grille (Grill)  (x2) ..... EUR 0.04706 each = EUR 0.09412
[New] Red Tile 1 x 2 with Groove  (x80) ..... EUR 0.04538 each = EUR 3.6304
[New] Reddish Brown Plate 1 x 1  (x10) ..... EUR 0.04958 each = EUR 0.4958
[New] Red Bar 4L (Lightsaber Blade / Wand)  (x24) ..... EUR 0.28926 each = EUR 6.94224
[New] Red Plate, Modified 2 x 2 with Groove and 1 Stud in Center (Jumper)  (x22) ..... EUR 0.1405 each = EUR 3.091
[New] Dark Bluish Gray Brick 1 x 2  (x108) ..... US $0.053 each = US $5.724
[New] White Window 1 x 2 x 2 Flat Front  (x98) ..... US $0.125 each = US $12.25
[New] Light Bluish Gray Technic, Pin 1/2  (x50) ..... CZK 0.40 each = CZK 20.00
[Used] Green Plant Flower 2 x 2 Leaves - Angular  (x11) ..... US $0.10 each = US $1.10
'''
lotsTextParserTestResult = [
  {
    "amount": 2,
    "color": {
      "id": "11",
      "name": "Black",
      "rgb": "#212121"
    },
    "condition": "New",
    "part": {
      "categoryId": "7",
      "id": "2877",
      "name": "Brick, Modified 1 x 2 with Grille (Grill)"
    },
    "price": "EUR 0.09412",
    "priceEach": "EUR 0.04706"
  },
  {
    "amount": 80,
    "color": {
      "id": "5",
      "name": "Red",
      "rgb": "#b30006"
    },
    "condition": "New",
    "part": {
      "categoryId": "37",
      "id": "3069b",
      "name": "Tile 1 x 2 with Groove"
    },
    "price": "EUR 3.6304",
    "priceEach": "EUR 0.04538"
  },
  {
    "amount": 10,
    "color": {
      "id": "88",
      "name": "Reddish Brown",
      "rgb": "#89351d"
    },
    "condition": "New",
    "part": {
      "categoryId": "26",
      "id": "3024",
      "name": "Plate 1 x 1"
    },
    "price": "EUR 0.4958",
    "priceEach": "EUR 0.04958"
  },
  {
    "amount": 24,
    "color": {
      "id": "5",
      "name": "Red",
      "rgb": "#b30006"
    },
    "condition": "New",
    "part": {
      "categoryId": "46",
      "id": "30374",
      "name": "Bar 4L (Lightsaber Blade / Wand)"
    },
    "price": "EUR 6.94224",
    "priceEach": "EUR 0.28926"
  },
  {
    "amount": 22,
    "color": {
      "id": "5",
      "name": "Red",
      "rgb": "#b30006"
    },
    "condition": "New",
    "part": {
      "categoryId": "27",
      "id": "87580",
      "name": "Plate, Modified 2 x 2 with Groove and 1 Stud in Center (Jumper)"
    },
    "price": "EUR 3.091",
    "priceEach": "EUR 0.1405"
  },
  {
    "amount": 108,
    "color": {
      "id": "85",
      "name": "Dark Bluish Gray",
      "rgb": "#595D60"
    },
    "condition": "New",
    "part": {
      "categoryId": "5",
      "id": "3004",
      "name": "Brick 1 x 2"
    },
    "price": "US $5.724",
    "priceEach": "US $0.053"
  },
  {
    "amount": 98,
    "color": {
      "id": "1",
      "name": "White",
      "rgb": "#FFFFFF"
    },
    "condition": "New",
    "part": {
      "categoryId": "113",
      "id": "60592",
      "name": "Window 1 x 2 x 2 Flat Front"
    },
    "price": "US $12.25",
    "priceEach": "US $0.125"
  },
  {
    "amount": 50,
    "color": {
      "id": "86",
      "name": "Light Bluish Gray",
      "rgb": "#afb5c7"
    },
    "condition": "New",
    "part": {
      "categoryId": "139",
      "id": "4274",
      "name": "Technic, Pin 1/2"
    },
    "price": "CZK 20.00",
    "priceEach": "CZK 0.40"
  },
  {
    "amount": 11,
    "color": {
      "id": "6",
      "name": "Green",
      "rgb": "#00642e"
    },
    "condition": "Used",
    "part": {
      "categoryId": "25"
      "id": "4727",
      "name": "Plant Flower 2 x 2 Leaves - Angular"
    },
    "price": "US $1.10",
    "priceEach": "US $0.10"
  }
]
describe 'lotsTextParser', ->
  injector.get('route').setBaseURL '//localhost:8080'
  lotsTextParser = injector.get 'lotsTextParser'
  describe '#parse()', ->
    result = null
    it 'should return a promise', ->
      p = lotsTextParser.parse('')
      expect(typeof p.then).toBe 'function'
      expect(typeof p.catch).toBe 'function'
    it 'should return a list of { part, color, condition, amount, priceEach, price }', ->
      lotsTextParser.parse(lotsTextParserTestText).then (r) -> result = r
      waitsFor 5000, -> result
      runs ->
        expect(Array.isArray result).toBe true
        expect(typeof result[0].part)     .toBe 'object'
        expect(typeof result[0].color)    .toBe 'object'
        expect(typeof result[0].condition).toBe 'string'
        expect(typeof result[0].amount)   .toBe 'number'
        expect(typeof result[0].priceEach).toBe 'string'
        expect(typeof result[0].price)    .toBe 'string'
    it 'should parse correctly', ->
      result.forEach (lot, i) ->
        delete lot.part.colors
        expect(lot).toEqual(lotsTextParserTestResult[i])