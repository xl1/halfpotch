class Controller extends Assoc
  constructor: (@models, @data) ->
    models.category.reset data.categories
    super {
      category: null
      part: null
      color: null
    }

  set: (name, value) ->
    # 何かが set されたらその次のリストを更新する
    switch name
      when 'category' then @models.part.reset @data.categories[value].parts
      when 'part'     then @models.color.reset @data.parts[value].colors
    super(name, value)


class SelectModel extends Model # window.Select is reserved
  constructor: (@type) ->
    super()
    @options = []

  reset: (source) ->
    @options = []
    ids = Object.keys(source).sort (a, b) ->
      source[a].name.localeCompare source[b].name
    for id in ids
      item = source[id]
      @add item.id, item.name, false
    @change()

  add: (value, text, change=true) ->
    option = new OptionModel(@type, value, text)
    @options.push option
    if change
      @change 'add', option

class OptionModel extends Model
  constructor: (@type, @value, @text) -> super()



class SelectView extends View
  constructor: (model, @elem) ->
    super model
    model.listen 'add', @add.bind @

  add: (option) ->
    view = new OptionView(option)
    @elem.appendChild view.elem

  render: ->
    @elem.innerHTML = ''
    for option in @model.options
      @add option
    return

class OptionView extends View
  constructor: (model) ->
    super model

    @elem = document.createDocumentFragment()
    label = document.createElement 'label'
    radio = document.createElement 'input'
    radio.type = 'radio'
    label.setAttribute('for', radio.id = 'option' + model._uuid)

    label.textContent = model.text
    radio.value = model.value
    radio.name = model.type
    @elem.appendChild radio
    @elem.appendChild label


main = ->
  models = {}
  for type in ['category', 'part', 'color', 'partInCart']
    models[type] = model = new SelectModel(type)
    view = new SelectView model, $(type + 'Select')
  new DataLoader().load (data) ->
    controller = new Controller(models, data)
    new FormView(controller, $ 'form')

document.addEventListener 'DOMContentLoaded', main, false