# -*- coding: utf-8 -*-

import email.header
import email.utils
import mailbox
import re
from datetime import datetime
from StringIO import StringIO

class MessageInformation:
  def __init__(self, message):
    self.to = message['to']
    self.cc = message['cc']
    self.bcc = message['bcc']
    self.reply_to = message['reply-to']
    self.sender = message['from']
    self.subject, _ = email.header.decode_header(message['subject'])[0]
    m = message
    while m.is_multipart():
      m = m.get_payload(0)
    self.body = m.get_payload(decode=True)


class mboxFromString(mailbox.mbox):
  def __init__(self, source, factory=None, create=True):
    self._message_factory = mailbox.mboxMessage
    self._path = ''
    self._factory = factory
    self._file = StringIO(source)
    self._toc = None
    self._next_key = 0
    self._pending = False
    self._locked = False
    self._file_length = None


class MboxInformation:
  def __init__(self, source):
    try:
      self.mbox = mboxFromString(source)
    except KeyError:
      self.mbox = None

  def __iter__(self):
    if self.mbox:
      for m in self.mbox:
        yield MessageInformation(m)


class OrderInformation:
  def __init__(self, minfo):
    self.message = minfo

  def getRecipientUserName(self):
    _, address = email.utils.parseaddr(self.message.to)
    return address[:address.index('@')]

  def getTitle(self):
    m = re.search(r'BrickLink Order #(\d+)', self.message.subject)
    return m.group(0) if m else self.message.subject

  def getLotsText(self):
    reLot = re.compile(r'\[(new|used)\] .+ \(x\d+\) \.+ .+$', re.IGNORECASE | re.MULTILINE)
    return '\n'.join(m.group(0) for m in reLot.finditer(self.message.body))

  def getOrderDate(self):
    m = re.search(r'^\W*Order Date: (.*)$', self.message.body, re.MULTILINE)
    if m:
      # e.g. "Jul 27, 2013 09:30"
      return datetime.strptime(m.group(1).strip(), '%b %d, %Y %H:%M')
    return datetime.now()
