describe 'logger', ->
  beforeEach module('logger')

  describe 'service.lotsTextParser', ->
    lotsTextParser = null
    beforeEach inject (_lotsTextParser_) ->
      lotsTextParser = _lotsTextParser_

    describe '#parse()', ->
      it 'should return a promise', ->
        promise = lotsTextParser.parse('')
        expect(promise).toBeDefined()
        expect(promise.then).toEqual jasmine.any(Function)

      it 'should parse BlickLink-styled text to an array of lots', ->
        text = '''
[New] Black Brick, Modified 1 x 2 with Grille (Grill)  (x2) ..... EUR 0.04706 each = EUR 0.09412
[New] Red Tile 1 x 2 with Groove  (x80) ..... EUR 0.04538 each = EUR 3.6304
        '''
        lots = []
        lotsTextParser.parse(text).then (d) ->
          lots = d

        waitsFor 1000, -> lots.length
        runs -> 
          expect(lots).toEqual [{
            condition: 'New'
            color: { name: 'Black', rgb: '#000000', id: '11' }
            part: { name: 'Brick, Modified 1 x 2 with Grille (Grill)', id: '2877'}
            priceEach: 'EUR 0.04706'
            amount: 2
            price: 'EUR 0.09412'
          }, {
            condition: 'New'
            color: { name: 'Red', rgb: '#b30006', id: '5' }
            part: { name: 'Tile 1 x 2 with Groove', id: '3069' }
            priceEach: 'EUR 0.04538'
            amount: 80
            price: 'EUR 3.6304'
          }]
