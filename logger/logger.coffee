# utils
class Controller
  @getController: -> 
    required = angular.injector().annotate(@)
    required.unshift('$scope')
    required.push ($scope, args...) =>
      for key, value of @::
        if typeof value is 'function'
          $scope[key] = value.bind($scope)
        else
          $scope[key] = value
      @apply($scope, args)
    required


# application
app = angular.module('logger', [])


# services
app.service 'lotsTextParser', (dataLoader) ->
  data: dataLoader.load().then ({ parts, colors }) ->
    partList = (p for _, p of parts).sort (a, b) ->
      b.name.length - a.name.length
    colorList = (c for _, c of colors).sort (a, b) ->
      b.name.length - a.name.length
    { partList, colorList }

  parse: (text) ->
    @data.then (data) =>
      for line in text.split(/[\r\n]+/) when line
        @parseLotText(line, data)

  searchColor: (text, { colorList }) ->
    for c in colorList when text.indexOf(c.name) >= 0
      return c
    return

  searchPart: (text, { partList }) ->
    for p in partList when text.indexOf(p.name) is 0
      return p
    return { name: text }

  parseLotText: (text, data) ->
    condition = ''
    amount = 1
    priceEach = ''
    price = ''
    text = text.replace /\[(new|used)\]/i, (_, cond) ->
      condition = if cond.toLowerCase() is 'new' then 'New' else 'Used'
      ''
    .replace /(?:\Wx(\d+))|(?:(\d+)x\W)/i, (_, a1, a2) ->
      amount = +(a1 or a2)
      ''
    .replace /\s+([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)(\s*each)?/, (_, cur, p) ->
      priceEach = cur + p
      price = cur + (+p * amount)
      ''
    .replace /\s+([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)/, (_, cur, p) ->
      price = cur + p
      ''
    .replace /\ [.,]+ /g, -> ' '

    if color = @searchColor(text, data)
      cname = color.name
      idx = text.indexOf(cname)
      text = text.slice(0, idx) + text.slice(idx + cname.length)
    part = @searchPart(text.trim(), data)
    { condition, amount, priceEach, price, color, part }



# directives
app.directive 'contenteditable', ->
  require: 'ngModel'
  link: (scope, elem, attrs, model) ->
    elem.bind 'blur', ->
      scope.$apply ->
        model.$setViewValue(elem.html())
    model.$render = ->
      elem.html(@$viewValue)

app.directive 'onEnter', ->
  (scope, elem, attrs) ->
    elem.bind 'keydown', (e) ->
      if e.keyCode == 13
        scope.$apply attrs.onEnter

app.directive 'inputDate', (dateFilter) ->
  require: 'ngModel'
  link: (scope, elem, attrs, model) ->
    model.$render = ->
      elem.val(dateFilter(@$viewValue, 'yyyy-MM-dd'))


# controllers
class Logger extends Controller
  constructor: (@$http, @lotsTextParser, @loggerConstants) ->
    @user = {
      name: 'anonymous'
      isLoggedIn: false
    }
    @newLabelText = ''
    @newLotsText = ''
    @selectedOrder = null
    $http(
      method: 'GET'
      url: loggerConstants.apiurl + @user.name
      responseType: 'json'
    ).success (@orders) =>
      @selectedOrder = orders[0]

  select: (@selectedOrder) ->

  addLabel: ->
    @selectedOrder?.labels.push @newLabelText
    @newLabelText = ''

  deleteLabel: (label) ->
    if order = @selectedOrder
      idx = order.labels.indexOf(label)
      if idx >= 0
        order.labels.splice(idx, 1)

  getLabelStyle: (label) ->
    x = 0xC0FFEE
    for s in label
      i = s.charCodeAt(0)
      t = x ^ (x << 11)
      x = (i << 3) ^ (i << 13) ^ t ^ (t << 7)
    r = (x >>> 16) & 255
    g = (x >>> 8) & 255
    b = x & 255
    backgroundColor: "rgb(#{r}, #{g}, #{b})"
    color: if r + g + b < 0x180 then 'white' else 'black'

  addLots: ->
    if order = @selectedOrder
      @lotsTextParser.parse(@newLotsText).then (lots) ->
        order.lots = order.lots.concat(lots)
    @newLotsText = ''

  deleteLot: (lot) ->
    if order = @selectedOrder
      idx = order.lots.indexOf(lot)
      if idx >= 0
        order.lots.splice(idx, 1)

  save: ->
    return if @saving
    @saving = true
    order = @selectedOrder
    @$http(
      method: 'PUT'
      url: @loggerConstants.apiurl + @user.name + '/' + (order.id or 'new')
      data: JSON.stringify(order)
    ).success((data) ->
      order.id = data.id
    ).finally =>
      @saving = false

  delete: ->
    order = @selectedOrder
    @selectedOrder = null
    @orders.splice(@orders.indexOf(order), 1)
    @$http(
      method: 'DELETE'
      url: @loggerConstants.apiurl + @user.name + '/' + order.id
    )


# initialize
app.controller 'logger', Logger.getController()
