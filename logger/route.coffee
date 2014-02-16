angular.module('logger').service 'route', ->
  baseURL = ''
  makeRoute = (path, obj) ->
    switch typeof obj
      when 'string'
        -> baseURL + path + obj
      when 'function'
        -> baseURL + path + obj(arguments...)
      else
        result = {}
        for own key, value of obj
          result[key] = makeRoute(path + '/' + key, value)
        result

  route = makeRoute '',
    data:
      fx: ''
      parts: ''
      colors: ''
      codes: ''
    logger:
      api:
        verify: ''
        orders: (name) -> if name then "/#{name}" else ''
        order:
          create: ''
          update: (id) -> "/#{id}"
          delete: (id) -> "/#{id}"
        import: ''
  route.setBaseURL = (b) -> baseURL = b
  route