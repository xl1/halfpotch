# -*- coding: utf-8 -*-

import webapp2
from google.appengine.api import memcache
import core
import keys


class TSVHandler(webapp2.RequestHandler):
  def get(self, viewType):
    data = core.dbLoadText(viewType)
    if data:
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.headers['Access-Control-Allow-Origin'] = '*'
      self.response.out.write(data)
    else:
      self.error(404)


class TSVUpdater(webapp2.RequestHandler):
  def get(self, viewType):
    # fetch TSV data from Bricklink.com
    TYPES = ['parts', None, None, 'colors', None, 'codes']
    viewType = viewType.lower()
    if viewType not in TYPES:
      return self.error(404)

    num = TYPES.index(viewType)
    result = core.fetch(
      'http://www.bricklink.com/catalogDownload.asp' +
      '?a=a&itemType=P&downloadType=T&viewType=' + str(num)
    )
    if result:
      core.dbSaveText(viewType, result.content)
      self.response.out.write('succeeded')
    else:
      self.error(500)


class FXHandler(webapp2.RequestHandler):
  def get(self):
    url = (
      'http://openexchangerates.org/api/latest.json?app_id=' +
      keys.openexchangerates
    )
    data = memcache.get(url)
    if data is None:
      result = core.fetch(url)
      if result:
        data = result.content
        memcache.set(url, data, time=43200)
      else:
        return self.error(500)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(data)


app = webapp2.WSGIApplication([
  (r'/data/(parts|colors|codes)', TSVHandler),
  (r'/data/(parts|colors|codes)/update', TSVUpdater),
  (r'/data/fx', FXHandler)
], debug=True)
