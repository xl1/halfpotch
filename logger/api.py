# -*- coding: utf-8 -*-

import webapp2
import json
from datetime import datetime
from google.appengine.ext import ndb
from google.appengine.api import memcache, users

class Order(ndb.Model):
  username = ndb.StringProperty()
  date = ndb.DateTimeProperty()
  content = ndb.JsonProperty()


class OrderListHandler(webapp2.RequestHandler):
  def get(self, username):
    if username != u'anonymous':
      return self.error(404)
    orders = Order.query(Order.username == username).order(-Order.date).iter()

    orderList = []
    for order in orders:
      content = order.content
      content['id'] = order.key.id()
      orderList.append(content)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(orderList))


class OrderHandler(webapp2.RequestHandler):
  def respond(self, order):
    content = order.content
    content['id'] = order.key.id()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(content))

  def get(self, username, orderid):
    order = Order.get_by_id(orderid)
    if order is None:
      return self.error(404)
    self.respond(order)

  def put(self, username, orderid):
    order = Order.get_by_id(orderid) or Order(username=username)
    content = json.loads(self.request.body)
    if content['date']:
      order.date = datetime.strptime(content['date'], '%Y-%m-%d')
    else:
      order.date = datetime.now()
    order.content = content
    order.put()
    self.respond(order)


app = webapp2.WSGIApplication([
  (r'/logger/api/(\w+)', OrderListHandler),
  (r'/logger/api/(\w+)/(\w+)', OrderHandler)
], debug=True)