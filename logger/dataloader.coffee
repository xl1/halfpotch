app = angular.module('logger')

app.service 'dataLoader', ($q, $http, loggerConstants) ->
  cache: null

  unescapeHTML: (text) ->
    angular.element('<div>').html(text).text()

  get: (url) ->
    $http.get(url).then ({ data }) ->
      (line.split('\t') for line in data.trim().split('\r\n') when line)

  load: ->
    if @cache
      return $q.when(@cache)
    colors = {}
    colorNames = {}
    parts = {}
    categories = {}

    $q.all(
      (@get("/data/#{name}") for name in ['colors', 'codes', 'parts'])
    ).then ([colorsData, codesData, partsData]) =>
      for [colorId, colorName, rrggbb] in colorsData
        colors[colorId] = colorNames[colorName] =
          { id: colorId, name: @unescapeHTML(colorName), rgb: '#' + rrggbb }
      for [id, colorName] in codesData
        color = colorNames[colorName]
        continue unless color
        part = parts[id] or= { id, colors: [] }
        if color not in part.colors
          part.colors.push color
      for [categoryId, categoryName, id, name] in partsData
        part = parts[id]
        continue unless part
        category = categories[categoryId] or=
          { id: categoryId, name: @unescapeHTML(categoryName), parts: [] }
        part.name = @unescapeHTML(name)
        part.categoryId = categoryId
        category.parts.push part

      @cache = { categories, parts, colors }
