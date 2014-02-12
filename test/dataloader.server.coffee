injector = angular.injector ['ng', 'logger']

describe 'dataLoader', ->
  injector.get('route').setBaseURL '//localhost:8080'
  dataLoader = injector.get 'dataLoader'

  describe '#load()', ->
    result = null
      
    it 'should return categories/parts/colors data', ->
      dataLoader.load().then (r) -> result = r
      waitsFor 5000, -> result
      runs ->
        expect(result).toBeDefined()
        expect(result.categories).toBeDefined()
        expect(result.parts).toBeDefined()
        expect(result.colors).toBeDefined()

    getItem = (source) ->
      keys = Object.keys(source)
      source[keys[keys.length >>> 1]]

    it 'category should have properties: id, name, parts', ->
      cat = getItem(result.categories)
      expect(typeof cat.id).toBe 'string'
      expect(typeof cat.name).toBe 'string'
      expect(Array.isArray(cat.parts)).toBe true

    it 'part should have properties: id, name, colors, categoryId', ->
      part = getItem(result.parts)
      expect(typeof part.id).toBe 'string'
      expect(typeof part.name).toBe 'string'
      expect(Array.isArray(part.colors)).toBe true
      expect(typeof part.categoryId).toBe 'string'

    it 'colors should have properties: id, name, rgb', ->
      color = getItem(result.colors)
      expect(typeof color.id).toBe 'string'
      expect(typeof color.name).toBe 'string'
      expect(color.rgb).toMatch /#[0-9A-Fa-f]{6}/
