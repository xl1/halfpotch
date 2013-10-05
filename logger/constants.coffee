angular.module('logger').constant 'loggerConstants',
  dataurl: '/data/'
  appurl: '/logger/'

  _debug:
    orders: [{
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
