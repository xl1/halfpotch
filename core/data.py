# -*- coding: utf-8 -*-

import webapp2
from google.appengine.api import memcache
import core
import re


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
  def get(self, curFrom, curTo):
    result = core.fetch(
      'http://www.google.com/ig/calculator?q=1%s=?%s' % (curFrom, curTo)
    )
    if result:
      val = re.search(r'rhs: "([\d.,]*)', result.content).group(1)
      self.response.out.write(val)
    else:
      self.error(500)


app = webapp2.WSGIApplication([
  (r'/data/(\w+)', TSVHandler),
  (r'/data/(\w+)/update', TSVUpdater),
  (r'/data/fx/([^/]+)/([^/]+)', FXHandler)
], debug=True)
