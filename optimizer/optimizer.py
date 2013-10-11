#!/usr/bin/env python
# -*- encoding:utf-8 -*-

import webapp2
import re
import json
from HTMLParser import HTMLParser
from google.appengine.api import urlfetch, memcache


class StoreData(webapp2.RequestHandler):
  def getData(self, part, color):
    url = 'http://www.bricklink.com/catalogPG.asp' + \
          '?P=' + part + '&colorID=' + color
    # use memecache
    data = memcache.get(url)
    if data is not None:
      return data
    try:
      source = urlfetch.fetch(
        url,
        headers={'Cookie': 'isCountryID=JP; viewCurrencyID=74; rememberMe=N'},
        deadline=10
      )
    except urlfetch.DownloadError:
      return None
    if source.status_code != 200:
      return None

    frame = re.search(
      'Currently Available(.*)Currently Available', source.content
    )
    if frame:
      data = frame.group(1)
    else:
      data = ''
    memcache.add(url, data, time=43200)
    return data

  def get(self):
    part = self.request.get('part')
    color = self.request.get('color')
    amount = int(self.request.get('amount'))
    result = []

    data = self.getData(part, color)
    if data is None:
      return self.error(500)

    self.response.headers['Content-Type'] = 'application/json'
    if data == '':
      # パーツとしてはありうるけど一つも売っていない
      # 例: Very Light Gray Brick 1 x 1
      # http://www.bricklink.com/catalogPG.asp?P=3005&colorID=49
      return self.response.out.write('[]')
    
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
    parser = HTMLParser()
    seen = set()
    for match in pattern.findall(data):
      url, sID, name, lot, price = match
      if sID in seen:
        continue # 一つの店で複数の買い方があることがある、それは安い方のみをとる
      seen.add(sID)
      lot = int(lot)
      if lot >= amount and lot >= 8:
        result.append({
          'id': sID,
          'name': parser.unescape(name),
          'price': float(price),
          'url': url
        })

    self.response.out.write(json.dumps(result))


app = webapp2.WSGIApplication([
  ('/optimizer/app/getstoredata', StoreData)
], debug=True)
