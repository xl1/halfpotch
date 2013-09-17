# utils
class Controller
  @getController: -> 
    required = angular.injector().annotate(@)
    required.unshift('$scope')
    required.push ($scope, args...) =>
      for key, value of new @()
        if typeof value is 'function'
          $scope[key] = value.bind($scope)
        else
          $scope[key] = value
      @apply($scope, args)
    required


# application
app = angular.module('logger', [])

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
  constructor: ->
    @user = {
      name: 'Anonymous'
      isLoggedIn: false
    }
    @newLabelText = ''
    @newLotsText = ''
    @selectedOrder = null
    @_debug()

  _debug: ->
    @orders = [{
      title: 'BrickLink Order #1234567'
      labels: ['Label1']
      date: '2013-07-27'
      comment: 'これはコメントです'
      lots: [{
        color: { id: 11, name: 'Black', rgb: 'black' }
        part: { id: 3004, name: 'Brick 1 x 2' }
        condition: 'New'
        priceEach: 'EUR 0.0501'
        amount: 100
        price: 'EUR 5.0100'
      }, {
        color: { id: 5, name: 'Red', rgb: '#b30006' }
        part: { id: 3003, name: 'Brick 2 x 2' }
        condition: 'New'
        priceEach: 'US $0.03'
        amount: 200
        price: 'US $6.00'
      }]
    }, {
      title: 'BrickLink Order #1111111'
      labels: []
      date: '2012-12-24'
      comment: 'コメント'
      lots: [{
        color: { name: '' }
        part: { name: '#2259 Ninjago Skull Motorbike' }
        condition: 'New'
        priceEach: '\\4,500'
        price: '\\4,500'
      }]
    }, {
      title: 'BrickLink Order #1000000'
      labels: ['Label1', 'Label2']
      date: '2012-05-10'
      comment: 'これもコメントです'
      lots: []
    }]

  select: (order) ->
    @selectedOrder = order

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
      lines = @newLotsText.split(/[\r\n]+/)
      lots = (@parseLotText(line) for line in lines when line)
      order.lots = order.lots.concat(lots)
    @newLotsText = ''

  deleteLot: (lot) ->
    if order = @selectedOrder
      idx = order.lots.indexOf(lot)
      if idx >= 0
        order.lots.splice(idx, 1)

# initialize
app.controller 'logger', Logger.getController()
