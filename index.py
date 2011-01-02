import xml.parsers.expat
page = ""
title = ""
action = 0
total = 0

w = open("wiki.txt","w")

unsorted = []

import htmlentitydefs, re
#http://snipplr.com/view.php?codeview&id=26266


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
      global w, d
      p = page.encode('utf-8')
      pln = len(p)
      unsorted.append((slugfy(title.encode('utf-8')), title.encode('utf-8'), w.tell(), pln))
      w.write(p)
      #todo: escape ; occurances
      page = ""
      title = ""
      if total % 50 == 0:
        print "Total: ",total
  action = 0
    

def char_data(data):
  #print 'Character data:', repr(data)
  global action, page, title
  
  if action > 0:
    #if data.startswith("[[Category:"):
    #  action = 0
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

print "creating index..."
d = open('index.txt', 'w')
print "sorting index..."
unsorted.sort(lambda x,y: cmp(x[0], y[0]))
print "mapping index..."
mapped = map(lambda x: x[0] + ';' + x[1] + ';'+ str(x[2]) + ';' + str(x[3]) + "\n",unsorted)
print "writing index..."
d.writelines(mapped)
w.close()
d.close()
