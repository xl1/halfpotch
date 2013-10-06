# -*- coding: utf-8 -*-

import urllib2
import re
from time import sleep

def getCurrencyPrefix(viewCurrencyID):
  url = 'http://www.bricklink.com/catalogPG.asp?P=3867&colorID=3'
  pattern = re.compile(
    r'<TD>Min Price:</TD><TD><B>([^\d]+?)([.,\d]+)</B></TD>'
  )
  req = urllib2.Request(
    url=url,
    headers={'Cookie': 'viewCurrencyID=%s; rememberMe=N' % viewCurrencyID}
  )
  try:
    content = urllib2.urlopen(req).read()
  except urllib2.HTTPError:
    return None
  match = re.search(pattern, content)
  if match is None:
    return None
  sleep(2)
  return match.group(1)

def main():
  list = [173, 14, 26, 172, 32, 36, 40, 43, 45, 168, 2, 174, 65, 66, 164, 69, 72, 74, 167, 166, 171, 90, 95, 102, 106, 113, 114, 27, 116, 117, 162, 123, 170, 78, 135, 136, 138, 169, 144, 146, 1]
  currencyPrefixes = [getCurrencyPrefix(v) for v in list]
  print currencyPrefixes

main()
