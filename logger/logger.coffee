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
    .replace /\ [.,]+ /g, ' '

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


# models
app.factory 'Order', ($http, dateFilter, lotsTextParser, route) ->
  class Order
    @fetchAll: ->
      $http.get(route.logger.api.orders()).then ({ data }) ->
        (new Order o for o in data)

    constructor: (order={}) ->
      @id       = order.id
      @title    = order.title ? 'New Entry'
      @comment  = order.comment or ''
      @date     = order.date or dateFilter(new Date(), 'yyyy-MM-dd')
      @labels   = order.labels or []
      @lots     = order.lots or []
      if order.unresolved
        lotsTextParser.parse(order.lotsText).then (@lots) =>

    addLabel: (text) ->
      @labels.push text

    deleteLabel: (label) ->
      idx = @labels.indexOf(label)
      if idx >= 0
        @labels.splice(idx, 1)

    addLots: (lots) ->
      @lots.push(lots...)

    deleteLot: (lot) ->
      idx = @lots.indexOf(lot)
      if idx >= 0
        @lots.splice(idx, 1)

    toJSON: ->
      { @id, @title, @comment, @date, @labels, @lots }

    save: ->
      order = route.logger.api.order
      $http.post(
        if @id then order.update(@id) else order.create()
        @toJSON()
      ).success ({ id: @id }) =>

    delete: ->
      $http.post route.logger.api.order.delete @id


# controllers
class Logger extends Controller
  constructor: (@$window, $http, route) ->
    @user = {}
    $http.get(route.logger.api.verify()).success (@user) =>

  move: (url) ->
    @$window.location.href = url


class OrderDetail extends Controller
  constructor: (@$window, @$q, @lotsTextParser, @Order) ->
    @orders = []
    @newLabelText = ''
    @newLotsText = ''
    @selectedOrder = null
    @isDirty = false
    Order.fetchAll().then (@orders) =>
      @selectedOrder = @orders[0]
    $window.addEventListener 'beforeunload', =>
      @saveOrder()
      return
    , false

  select: (order) ->
    @saveOrder()
    @selectedOrder = order

  addOrder: ->
    @saveOrder()
    @orders.unshift(@selectedOrder = new @Order())
    @isDirty = true
    @saveOrder()

  addLabel: ->
    @isDirty = true
    @selectedOrder.addLabel @newLabelText
    @newLabelText = ''

  deleteLabel: (label) ->
    @isDirty = true
    @selectedOrder.deleteLabel label

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
    color: if 0.3 * r + 0.58 * g + 0.12 * b < 0x80 then 'white' else 'black'

  addLots: ->
    order = @selectedOrder
    @isDirty = true
    @lotsTextParser.parse(@newLotsText).then order.addLots.bind(order)
    @newLotsText = ''

  deleteLot: (lot) ->
    @isDirty = true
    @selectedOrder.deleteLot lot

  saveOrder: ->
    if not @isDirty
      return @$q.all()
    @isDirty = false
    @selectedOrder.save()

  deleteOrder: ->
    order = @selectedOrder
    @selectedOrder = null
    @orders.splice(@orders.indexOf(order), 1)
    order.delete()


class Statistics extends Controller
  constructor: (Order, @exchangeRate) ->
    @totalParts = 0
    @totalPrice = 0
    @colors = []
    exchangeRate.load().then =>
      @$watch '$parent.selectedOrder', @update.bind @

  update: ->
    @totalParts = 0
    @totalPrice = 0
    colorMap = {}
    for order in @$parent.orders
      for lot in order.lots
        @totalParts += lot.amount
        if lot.price
          @totalPrice += @exchangeRate.exchange(lot.price, 'JPY') or 0
        if lot.color
          m = colorMap[lot.color.id] or= { color: lot.color, amount: 0 }
          m.amount += lot.amount
    @colors =
      (v for own _, v of colorMap).sort (a, b) -> b.amount - a.amount

  getColorStyle: (color) ->
    backgroundColor: color.color.rgb
    width: "#{color.amount / @totalParts * 100}%"


# initialize
app.controller 'logger', Logger.getController()
app.controller 'orderDetail', OrderDetail.getController()
app.controller 'statistics', Statistics.getController()
