describe 'SuperArray', ->
  describe '#minBy()', ->
    it 'should return the element that minimizes the function', ->
      arr = new SuperArray([1..5])
      expect(arr.minBy (d) -> d).toBe 1
      expect(arr.minBy (d) -> (d - 1) * (d - 5)).toBe 3

  describe '#min()', ->
    it 'should return the minimum element', ->
      expect(new SuperArray([1..5]).min()).toBe 1
      expect(new SuperArray([10..3]).min()).toBe 3

  describe '#combinations()', ->
    it 'should return all N-elements combinations', ->
      comb = new SuperArray([1..5]).combinations(3)
      expect(comb.length).toBe 10
      expect(comb).toEqual [
        [1,2,3],[1,2,4],[1,2,5],[1,3,4],[1,3,5],
        [1,4,5],[2,3,4],[2,3,5],[2,4,5],[3,4,5]
      ]

      comb = new SuperArray([1,1,2]).combinations(2)
      expect(comb.length).toBe 3
      expect(comb).toEqual [
        [1,1],[1,2],[1,2]
      ]


describe 'Color', ->
  col = new Color 0, 30, 40

  describe '#r, #g, #b', ->
    it 'should be red/green/blue components', ->
      expect(col.r).toBe 0
      expect(col.g).toBe 30
      expect(col.b).toBe 40

  describe '#dist()', ->
    it 'should return the distance to color arg[0]', ->
      expect(col.dist new Color(0, 0, 0)).toBe 50
      expect(col.dist new Color(80, 90, 40)).toBe 100

  describe '#luma()', ->
    it 'should return luma', ->
      # see http://en.wikipedia.org/wiki/HSL_and_HSV#Lightness
      expect(col.luma() * 10 |0).toBe 221

  describe '#toArray()', ->
    it 'should return array of [red, green, blue]', ->
      expect(col.toArray()).toEqual [0, 30, 40]

  describe '#toString()', ->
    it 'should return CSS rgb() function style string', ->
      expect(col + '').toBe 'rgb(0, 30, 40)'


describe 'Model and View', ->
  model = new Model()
  view1 = new View(model)
  view2 = new View(model)

  it 'View#model should be a model that was passed to constructor', ->
    expect(view1.model).toBe model
    expect(view2.model).toBe model

  it 'View#render() should be called when Model#change() is called', ->
    spyOn(view1, 'render')
    spyOn(view2, 'render')
    model.change()
    expect(view1.render).toHaveBeenCalled()
    expect(view2.render).toHaveBeenCalled()

  it 'Model#change() should pass the arguments to View#render()', ->
    spyOn(view1, 'render')
    model.change('change', 1, 2, 3)
    expect(view1.render).toHaveBeenCalledWith(1, 2, 3)


describe 'FormView', ->
  form = document.createElement 'form'
  form.insertAdjacentHTML 'beforeend', '''
    <input name="foo" value="bar">
    <input name="pi" type="number" value="3.14159">
    <input name="answer" type="range" value="42" max="100" min="0" step="1">
    <input name="chk" type="checkbox">
    <input name="rad" type="radio" value="1" checked>
    <input name="rad" type="radio" value="2">
    <textarea name="text">text</textarea>
  '''
  assoc = new Assoc()
  view = new FormView assoc, form

  it 'should load the form data', ->
    expect(assoc.get 'foo').toBe 'bar'
    expect(assoc.get 'pi').toBe 3.14159
    expect(assoc.get 'answer').toBe 42
    expect(assoc.get 'chk').toBe false
    expect(assoc.get 'rad').toBe '1'
    expect(assoc.get 'text').toBe 'text'

  it 'should change assoc if form is changed', ->
    expect(assoc.get 'foo').toBe 'bar'
    expect(assoc.get 'rad').toBe '1'

    # custom events on an element that doesnt belong to the document tree
    # dont bubble on Chrome 27
    waitsFor (-> document.body), 100
    runs ->
      document.body.appendChild form
      # dispatch change event
      e = document.createEvent('HTMLEvents')
      e.initEvent 'change', true, true
      form.foo.value = 'hoge'
      form.foo.dispatchEvent(e)
      form.rad[1].checked = true
      form.rad[1].dispatchEvent(e)
      expect(assoc.get 'foo').toBe 'hoge'
      expect(assoc.get 'rad').toBe '2'
      document.body.removeChild form


describe 'escapeHTML', ->
  it 'should escape &, <, >, ", and \'', ->
    expect(escapeHTML '&gt;<a>b"c\'').toBe '&#38;gt;&#60;a&#62;b&#34;c&#39;'

describe 'unescapeHTML', ->
  it 'should unescape &...; and &#...;', ->
    expect(unescapeHTML '&lt;hoge&#62;').toBe '<hoge>'
