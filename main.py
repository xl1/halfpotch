#!/usr/bin/env python
# -*- encoding:utf-8 -*-

import webapp2
import re
import json
from xml.sax.saxutils import unescape
from google.appengine.api import urlfetch

class BrickLinkData(webapp2.RequestHandler):
  def get(self):
    # fetch CSV data from Bricklink.com
    self.response.out.write('not implemented')

class PartsData(webapp2.RequestHandler):
  def get(self):
    # serve CSV data of categories, codes, and colors
    self.response.out.write('not implemented')


class StoreData(webapp2.RequestHandler):
  def get(self):
    part = self.request.get('part')
    color = self.request.get('color')
    amount = int(self.request.get('amount'))
    result = []
    self.response.headers['Content-Type'] = 'application/json'

    url = 'http://www.bricklink.com/catalogPG.asp?P=%s&colorID=%s' % (part, color)
    try:
      source = urlfetch.fetch(
        url,
        headers={ 'Cookie': 'isCountryID=JP; viewCurrencyID=74; rememberMe=N' },
        deadline=10
      )
    except urlfetch.DownLoadError:
      return self.error()
    if source.status_code != 200:
      return self.error()

    frame = re.search(
      'Currently Available(.*)Currently Available', source.content
    )
    if not frame:
      return self.error()
    
    pattern = re.compile(r"""
      <TR\ ALIGN="RIGHT">
        <TD\ NOWRAP>
          &nbsp;
          <A\ HREF="(/store\.asp\?sID=(\w+)&itemID=\w+)">
            <IMG\ SRC="/images/box16Y\.png" .*? ALT="Store:\ ([^"]+)" .*? >
          </A>
          &nbsp;
        </TD>
        <TD>(\d+)</TD>
        <TD>&nbsp;~JPY&nbsp;([.0-9]+)</TD>
      </TR>
    """, re.VERBOSE) # unescaped spaces は無視
    for match in pattern.findall(frame.group(1)):
      url, sID, name, lot, price = match
      lot = int(lot)
      if lot >= amount and lot >= 8:
        result.append({
          'id': sID,
          'name': unescape(name),
          'price': float(price),
          'url': url
        })

    self.response.out.write(json.dumps(result))

  def error(self):
    self.response.write('[]')


app = webapp2.WSGIApplication([
  ('/script/getpartsdata', PartsData),
  ('/script/getstoredata', StoreData),
  ('/script/getbldata', BrickLinkData)
], debug=True)
