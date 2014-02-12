angular.module('logger').service 'exchangeRate', ($http, route) ->
  data = null
  currencyMap =
    'ARS ': 'ARS'
    'AU $': 'AUD'
    'BRL ': 'BRL'
    'BGN ': 'BGN'
    'CA $': 'CAD'
    'CNY ': 'CNY'
    'HRK ': 'HRK'
    'CZK ': 'CZK'
    'DKK ': 'DKK'
    'EEK ': 'EEK'
    'EUR ': 'EUR'
    'GTQ ': 'GTQ'
    'HK $': 'HKD'
    'HUF ': 'HUF'
    'INR ': 'INR'
    'IDR ': 'IDR'
    'ILS ': 'ILS'
    'JPY ': 'JPY'
    'LVL ': 'LVL'
    'LTL ': 'LTL'
    'MOP ': 'MOP'
    'MYR ': 'MYR'
    'MXN ': 'MXN'
    'NZ $': 'NZD'
    'NOK ': 'NOK'
    'PHP ': 'PHP'
    'PLN ': 'PLN'
    'GBP ': 'GBP'
    'ROL ': 'RON'
    'RUB ': 'RUB'
    'RSD ': 'RSD'
    'SG $': 'SGD'
    'ZAR ': 'ZAR'
    'KRW ': 'KRW'
    'SEK ': 'SEK'
    'CHF ': 'CHF'
    'TWD ': 'TWD'
    'THB ': 'THB'
    'TRY ': 'TRY'
    'UAH ': 'UAH'
    'US $': 'USD'
    '\\': 'JPY' # not used in BrickLink

  load: ->
    $http.get(route.data.fx()).success ({ rates }) => data = rates

  exchange: (fromValue, toCurrency) ->
    if r = /([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)/.exec fromValue
      fromCurrency = r[1]
      value = +r[2]
      value * data[toCurrency] / data[currencyMap[fromCurrency]]