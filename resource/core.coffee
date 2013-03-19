# utilities
$ = (id) -> document.getElementById id

class SuperArray extends Array
  constructor: (ary=[]) -> Array::push.apply(@, ary)

  minBy: (func) ->
    min = Infinity
    solution = null
    for d in @
      res = func(d)
      [min, solution] = [res, d] if min > res
    solution

  maxBy: (func) -> @minBy (d) -> -func(d)
  min: -> Math.min @...
  max: -> Math.max @...

  combinations: (len) ->
    return [[]] unless len
    res = []
    for a, i in @
      for last in SuperArray::combinations.call @slice(i + 1), len - 1
        res.push [a].concat(last)
    res


uuid = do ->
  re = /[xy]/g
  replacer = (c) ->
    r = Math.random() * 16 |0
    (if c is 'x' then r else (r & 3 | 8)).toString 16
  ->
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(re, replacer).toUpperCase()


class Model
  constructor: ->
    @_uuid = uuid()
  change: ->
    eve "#{@_uuid}.change"

class View
  constructor: (@model) ->
    eve.on "#{model._uuid}.change", => @render()
  render: ->


class Color
  constructor: (@r=0, @g=0, @b=0) ->

  dist: (color) ->
    [dr, dg, db] = [color.r - @r, color.g - @g, color.b - @b]
    Math.sqrt(dr * dr + dg * dg + db * db)

  luma: -> @r * 0.3 + @g * 0.59 + @b * 0.11
  toArray: -> [@r, @g, @b]
  toString: -> "rgb(#{@r}, #{@g}, #{@b})"


class Assoc extends Model
  constructor: (@map={}) -> super()
  keys: -> Object.keys @map
  set: (name, value) -> @map[name] = value; @change()
  get: (name) -> @map[name]


class FormView extends View
  constructor: (model, @elem) ->
    super model
    for input in HTMLFormElement::querySelectorAll.call elem, '[name]'
      @_setValue input
    HTMLFormElement::addEventListener.call elem, 'change', (e) =>
      @_setValue e.target
    , false

  _setValue: (input) ->
    { name, value } = input
    # if type is not supported (e.g. "number" on Firefox 20),
    # input.type is regarded as "text"
    switch input.getAttribute('type')?.toLowerCase()
      when 'number', 'range'
        @model.set name, +value or 0
      when 'date', 'datetime-local'
        @model.set name, new Date(value)
      when 'checkbox'
        @model.set name, input.checked
      when 'radio'
        if input.checked
          @model.set name, value
      else
        @model.set name, value

#  render: ->
#    for name in @model.keys()
#      inputs = HTMLFormElement::querySelectorAll.call @elem, "[name=#{name}]"
#      continue unless inputs.length
#      value = @model.get name
#      switch inputs[0].type
#        when 'checkbox'
#          inputs[0].checked = value
#        when 'radio'
#          value = value.toString()
#          for input in inputs when input.value is value
#            input.checked = true
#            break
#        else
#          inputs[0].value = value
#    return