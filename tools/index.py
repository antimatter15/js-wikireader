import xml.parsers.expat
page = ""
title = ""
action = 0
total = 0
text_buffer = ""


w = open("wiki.lzma","w")
index = open("unsorted.txt","w")
redirects = open("redirects.txt","w")

index_buffer = []

import htmlentitydefs, re
#http://snipplr.com/view.php?codeview&id=26266

import pylzma

import struct
from cStringIO import StringIO
"""
{dictionarySize: 16, fb: 64,  matchFinder: 0, lc: 3, lp: 0, pb: 2},
{dictionarySize: 20, fb: 64,  matchFinder: 0, lc: 3, lp: 0, pb: 2},
{dictionarySize: 19, fb: 64,  matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 20, fb: 64,  matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 21, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 22, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 23, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 24, fb: 255, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 25, fb: 255, matchFinder: 1, lc: 3, lp: 0, pb: 2}
"""
def compress_compatible(data):
  c = pylzma.compressfile(StringIO(data), algorithm = 0, dictionary = 16, fastBytes = 64)
  # LZMA header
  result = c.read(5)
  # size of uncompressed data
  result += struct.pack('<Q', len(data))
  # compressed data
  return result + c.read()

def slugfy(text, separator = ""):
  ret = ""
  for c in text.lower():
    try:
      ret += htmlentitydefs.codepoint2name[ord(c)]
    except:
      ret += c
  ret = re.sub("([a-zA-Z])(uml|acute|grave|circ|tilde|cedil)", r"\1", ret)
  ret = re.sub("\W", " ", ret)
  ret = re.sub(" +", separator, ret)
  return ret.strip()


# 3 handler functions
def start_element(name, attrs):
  global action
  if name == "title":
    action = 1
  elif name == "text":
    action = 2
  #print 'Start element:', name, attrs
  
def end_element(name):
  global action, page, title
  if name == "page":
    global total
    total += 1
    if page != "" and title != "":
      global w, text_buffer, index_buffer, index, redirects
      page = page.encode('utf-8')
      title = title.encode('utf-8')
      
      page = re.sub(r'<ref( \w+=.*)?>[^\<\>]*</ref>', "", page)
      page = re.sub(r'\[\[\s*[a-z]{2,3}(-[a-z]{1,3}(-[a-z]{1,3})?)?:.*\]\]\s*', "", page)
      page = re.sub(r'<!--[^>]*?-->', "", page)
      page = re.sub(r'\|\s*[\w_]+\s*=\s*\n', "", page)
      mx = re.search(r'={1,4}\s*?references\s*?={1,4}', page, re.IGNORECASE)
      if mx is not None: page = page[0: mx.start(0)]
      mx = re.search(r'={1,4}\s*?sources\s*?={1,4}', page, re.IGNORECASE)
      if mx is not None: page = page[0: mx.start(0)]
      mx = re.search(r'={1,4}\s*?other websites\s*?={1,4}', page, re.IGNORECASE)
      if mx is not None: page = page[0: mx.start(0)]
      p = "=" + title + "=\n\n\n\n" + page
      
      pln = len(p)

      #todo: escape ; occurances
      m = re.match('\#REDIRECT.*\[\[([^\]]+)\]\]', page, re.I)
      if m is not None:
        redirects.write(slugfy(title) + ";" + title + ";" + m.group(1) + "\n")
      else:
        #41.3 at 130000 algorithm #2
        #43.3 at 60000 algorithm #2
        #45.5 at 30000 algorithm #2
        #45.4 at 30000 no EOS algorithm #1
        #47.5 at 30000 no EOS algorithm #0
        #47.6 at 30000 no EOS algorithm #0 dictionary 16 fastBytes 64
        
        #(size of simplewiki english in MB) at (compresion block size in bytes)
        #This number determines the size of the compression block.
        #js-lzma probably fails with anything over 130000
        #and also, bigger ones tend to be slower at decompression
        #but have slightly better compression ratios. 
        if len(text_buffer) + len(p) < 30000: #split into 100KB chunks
          text_buffer += p
        else:
          if len(text_buffer) > 40000:
            print "Warning: Insanely Huge Block"
            print index_buffer
          compressed = compress_compatible(text_buffer)
          cln = len(compressed)
          print "wrote sector length ",len(text_buffer), "compressed", cln
          w.write(compressed)
          index_buffer = []
          text_buffer = p
          
        index_buffer.append(title)
        index.write(slugfy(title) + ";"+ title + ";" + str(w.tell()) + "\n")

      page = ""
      title = ""
      if total % 50 == 0:
        print "Total: ",total
  action = 0
    

def char_data(data):
  global action, page, title
  if action > 0:
    if action == 1:
      title += data
    elif action == 2:
      page += data


p = xml.parsers.expat.ParserCreate()

p.StartElementHandler = start_element
p.EndElementHandler = end_element
p.CharacterDataHandler = char_data


import fileinput

for line in fileinput.input():
    p.Parse(line)
p.Parse("",1)

